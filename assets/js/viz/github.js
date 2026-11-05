/* 'github' widget: a clickable practice copy of github.com on the simulator engine.
 * config: {world, start: '/hamk-projects/thesis-aino', personas: ['aino', 'teacher'], tasks, terminal: false,
 *          uploads: {'report.pdf': '…'} (files offered by the fake file picker), height}
 * Routes: /signup · /settings/keys|tokens|security · /new · /orgs/<org>[/people|/teams|/teams/<t>|/settings] ·
 *   /<owner>/<repo>[/tree|blob|edit/<branch>/<path>] /new/<b> /upload/<b> /commits/<b> /commit/<sha> /branches
 *   /issues[/new|/<n>] /pulls /compare /pull/<n>[/files] /actions[/runs/<sha>] /releases[/new]
 *   /settings[/access|/rules|/rules/new|/rules/<i>]
 * Permissions come from the engine (w.roleOf / w.can / w.rulesFor): pages show, hide or disable exactly like GitHub.
 * Every action is replayable ({a: name, …}) and logged in w.events as {type: name, by, …}; tasks also see
 * {type: 'visit', path} and {type: 'click', id} for "find the button" tasks.
 * With terminal: true a Git Bash window shares the same world (push to the repositories you configure here). */
(function (TDC) {
  'use strict';
  var U = TDC.util, el = U.el, V = TDC.viz, T = TDC.t;
  var ROLE_LABEL = { read: 'Read', triage: 'Triage', write: 'Write', maintain: 'Maintain', admin: 'Admin', none: 'No permission' };

  // ---------- actions (pure on the world; replayed on reload) ----------
  function audit(w, org, text) { if (w.server.orgs[org]) w.server.orgs[org].audit.unshift({ by: w.me, text: text, t: w.clock }); }
  function tree(w, slug, branch) { var r = w.server.repos[slug], c = r && w.commit(r.refs[branch || r.defaultBranch]); return c ? c.tree : {}; }
  function parseOwners(text) { var o = []; String(text || '').replace(/@([\w-]+)/g, function (m, l) { if (o.indexOf(l) < 0) o.push(l); }); return o; }
  var A = {
    as: function (w, a) { w.switchComputer(a.login); },
    signup: function (w, a) { var u = w.ensureUser(a.login, a.name || a.login); u.email = a.email; w.me = a.login; },
    twofa: function (w) { w.server.users[w.me].twofa = true; },
    sshKey: function (w, a) { w.server.users[w.me].keys.push({ title: a.title, key: a.key.trim() }); },
    sshKeyDelete: function (w, a) { w.server.users[w.me].keys.splice(a.i, 1); },
    token: function (w, a) { w.server.users[w.me].tokens.push({ name: a.name, days: a.days, repos: a.repos, perm: a.perm }); },
    invite: function (w, a) { var o = w.server.orgs[a.org]; w.ensureUser(a.login); o.invites.push({ login: a.login, role: a.role }); audit(w, a.org, 'org.invite_member ' + a.login); },
    join: function (w, a) {
      var o = w.server.orgs[a.org], inv = o.invites.filter(function (i) { return i.login === w.me; })[0];
      o.invites = o.invites.filter(function (i) { return i.login !== w.me; });
      (inv && inv.role === 'owner' ? o.owners : o.members).push(w.me);
      o.outside = o.outside.filter(function (x) { return x !== w.me; });
      audit(w, a.org, 'org.add_member ' + w.me);
    },
    orgRole: function (w, a) {
      var o = w.server.orgs[a.org];
      o.owners = o.owners.filter(function (x) { return x !== a.login; }); o.members = o.members.filter(function (x) { return x !== a.login; });
      (a.role === 'owner' ? o.owners : o.members).push(a.login); audit(w, a.org, 'org.update_member ' + a.login + ' → ' + a.role);
    },
    removeMember: function (w, a) {
      var o = w.server.orgs[a.org];
      o.owners = o.owners.filter(function (x) { return x !== a.login; }); o.members = o.members.filter(function (x) { return x !== a.login; });
      Object.keys(o.teams).forEach(function (t) { o.teams[t].members = o.teams[t].members.filter(function (x) { return x !== a.login; }); });
      if (a.outside) {   // keep their direct repository access: they become an outside collaborator
        if (o.outside.indexOf(a.login) < 0) o.outside.push(a.login);
      } else {   // remove completely: membership, outside-collaborator status and every direct repository role
        var wasOutside = o.outside.indexOf(a.login) >= 0;
        o.outside = o.outside.filter(function (x) { return x !== a.login; });
        Object.keys(w.server.repos).forEach(function (s) { if (s.indexOf(a.org + '/') === 0) delete w.server.repos[s].collaborators[a.login]; });
      }
      audit(w, a.org, (a.outside ? 'org.convert_to_outside_collaborator ' : wasOutside ? 'org.remove_outside_collaborator ' : 'org.remove_member ') + a.login);
    },
    teamCreate: function (w, a) { var o = w.server.orgs[a.org]; o.teams[a.slug] = { name: a.name, description: a.description || '', parent: a.parent || null, members: [], repos: {} }; audit(w, a.org, 'team.create ' + a.slug); },
    teamMember: function (w, a) { var t = w.server.orgs[a.org].teams[a.team]; t.members = t.members.filter(function (x) { return x !== a.login; }); if (a.add) t.members.push(a.login); audit(w, a.org, 'team.' + (a.add ? 'add' : 'remove') + '_member ' + a.login + ' ' + a.team); },
    teamRepo: function (w, a) { var t = w.server.orgs[a.org].teams[a.team]; if (a.role) t.repos[a.slug] = a.role; else delete t.repos[a.slug]; audit(w, a.org, 'team.update_repository_permission ' + a.team + ' ' + a.slug + ' ' + (a.role || 'removed')); },
    orgSetting: function (w, a) {
      var o = w.server.orgs[a.org]; o.settings[a.key] = a.value; audit(w, a.org, 'org.update_setting ' + a.key + ' = ' + a.value);
      // like GitHub: requiring 2FA removes outside collaborators without it; members stay but are blocked (roleOf)
      if (a.key === 'require2fa' && a.value) o.outside.filter(function (l) { return !(w.server.users[l] || {}).twofa; }).forEach(function (l) {
        o.outside = o.outside.filter(function (x) { return x !== l; });
        Object.keys(w.server.repos).forEach(function (s) { if (s.indexOf(a.org + '/') === 0) delete w.server.repos[s].collaborators[l]; });
        audit(w, a.org, 'org.remove_outside_collaborator ' + l + ' (no 2FA)');
      });
    },
    repoCreate: function (w, a) {
      var files = {};
      if (a.template) files = JSON.parse(JSON.stringify(tree(w, a.template)));
      if (a.readme && !files['README.md']) files['README.md'] = '# ' + a.name + '\n\n' + (a.description || '') + '\n';
      if (a.gitignore) files['.gitignore'] = a.gitignore;
      if (a.license) files.LICENSE = a.license + ' License\n';
      var slug = a.owner + '/' + a.name;
      w.makeRemote(slug, { visibility: a.visibility, description: a.description, commits: Object.keys(files).length ? [{ msg: 'Initial commit', author: w.me, files: files }] : [] });
      if (!w.server.orgs[a.owner]) w.server.repos[slug].collaborators = {};
      audit(w, a.owner, 'repo.create ' + slug);
    },
    repoSetting: function (w, a) { w.server.repos[a.slug][a.key] = a.value; },
    rename: function (w, a) {
      var r = w.server.repos[a.slug], ns = r.owner + '/' + a.name;
      delete w.server.repos[a.slug]; r.slug = ns; r.name = a.name; w.server.repos[ns] = r;
      var o = w.server.orgs[r.owner]; if (o) Object.keys(o.teams).forEach(function (t) { var tr = o.teams[t].repos; if (tr[a.slug]) { tr[ns] = tr[a.slug]; delete tr[a.slug]; } });
    },
    visibility: function (w, a) { w.server.repos[a.slug].visibility = a.value; audit(w, a.slug.split('/')[0], 'repo.access ' + a.slug + ' → ' + a.value); },
    archive: function (w, a) { w.server.repos[a.slug].archived = a.value; audit(w, a.slug.split('/')[0], (a.value ? 'repo.archived ' : 'repo.unarchived ') + a.slug); },
    deleteRepo: function (w, a) { delete w.server.repos[a.slug]; audit(w, a.slug.split('/')[0], 'repo.destroy ' + a.slug); },
    transfer: function (w, a) {
      var r = w.server.repos[a.slug], ns = a.to + '/' + r.name;
      var from = r.owner;
      delete w.server.repos[a.slug]; r.slug = ns; r.owner = a.to; w.server.repos[ns] = r;
      // GitHub adds the original owner as a collaborator. shortcut: docs name no role; Admin (what they had) until verified
      if (!w.server.orgs[from] && !r.collaborators[from]) r.collaborators[from] = 'admin';
      audit(w, a.to, 'repo.transfer ' + a.slug + ' → ' + ns);
    },
    collab: function (w, a) { var r = w.server.repos[a.slug]; if (a.role) r.collaborators[a.login] = a.role; else delete r.collaborators[a.login]; audit(w, a.slug.split('/')[0], 'repo.update_member ' + a.login + ' ' + (a.role || 'removed')); },
    ruleSave: function (w, a) { var r = w.server.repos[a.slug]; if (a.i != null && r.rules[a.i]) r.rules[a.i] = a.rule; else r.rules.push(a.rule); audit(w, r.owner, 'repository_ruleset.update ' + a.rule.name); },
    ruleDelete: function (w, a) { w.server.repos[a.slug].rules.splice(a.i, 1); },
    commit: function (w, a) {
      var r = w.server.repos[a.slug];
      if (a.newBranch) r.refs[a.newBranch] = r.refs[a.branch];
      var b = a.newBranch || a.branch;
      w.webCommit(a.slug, b, a.changes, a.msg, w.me);
      Object.keys(a.changes).forEach(function (p) { if (/(^|\/)CODEOWNERS$/.test(p)) r.codeowners = parseOwners(a.changes[p]); });
      return b;
    },
    branch: function (w, a) { var r = w.server.repos[a.slug]; r.refs[a.name] = a.sha || r.refs[a.from || r.defaultBranch]; },
    branchDelete: function (w, a) {
      var r = w.server.repos[a.slug], p = a.pr && r.pulls.filter(function (x) { return x.num === a.pr; })[0];
      if (p) p.deletedHead = r.refs[a.name];   // lets the pull request page offer "Restore branch"
      delete r.refs[a.name];
    },
    fork: function (w, a) {
      var src = w.server.repos[a.slug], ns = w.me + '/' + src.name;
      if (w.server.repos[ns]) return;
      var f = w.makeRemote(ns, { commits: [], visibility: src.visibility === 'public' ? 'public' : 'private', description: src.description, forkOf: a.slug });
      f.refs = JSON.parse(JSON.stringify(src.refs)); f.defaultBranch = src.defaultBranch;
    },
    issue: function (w, a) {
      var r = w.server.repos[a.slug];
      r.issues.push({ num: r.nextNum++, title: a.title, body: a.body || '', author: w.me, state: 'open', labels: a.labels || [], assignees: a.assignees || [], milestone: a.milestone || null, comments: [] });
    },
    issueUpdate: function (w, a) {
      var r = w.server.repos[a.slug], is = r.issues.filter(function (x) { return x.num === a.num; })[0];
      if (a.comment) is.comments.push({ by: w.me, body: a.comment });
      if (a.state) is.state = a.state;
      if (a.labels) is.labels = a.labels;
      if (a.assignees) is.assignees = a.assignees;
      if (a.milestone !== undefined) is.milestone = a.milestone;
    },
    pr: function (w, a) { var p = w.openPull(a.slug, { title: a.title, body: a.body, head: a.head, headRepo: a.headRepo || a.slug, base: a.base, author: w.me }); p.reviewers = a.reviewers || []; },
    prComment: function (w, a) { w.server.repos[a.slug].pulls.filter(function (p) { return p.num === a.num; })[0].comments.push({ by: w.me, body: a.body }); },
    review: function (w, a) {
      var p = w.server.repos[a.slug].pulls.filter(function (x) { return x.num === a.num; })[0];
      p.reviews = p.reviews.filter(function (rv) { return rv.user !== w.me; });
      p.reviews.push({ user: w.me, state: a.state, body: a.body || '' });
    },
    requestReview: function (w, a) { var p = w.server.repos[a.slug].pulls.filter(function (x) { return x.num === a.num; })[0]; if ((p.reviewers || []).indexOf(a.login) < 0) (p.reviewers = p.reviewers || []).push(a.login); },
    merge: function (w, a) { return w.mergePull(a.slug, a.num, w.me, a.method); },
    prClose: function (w, a) { w.server.repos[a.slug].pulls.filter(function (x) { return x.num === a.num; })[0].state = 'closed'; },
    release: function (w, a) {
      var r = w.server.repos[a.slug];
      if (!r.tags[a.tag]) r.tags[a.tag] = r.refs[a.target || r.defaultBranch];
      r.releases.unshift({ tag: a.tag, name: a.name || a.tag, notes: a.notes || '', files: a.files || [], by: w.me });
    }
  };
  function applyAll(w, e) {
    if (e.a) {
      var res = A[e.a](w, e);
      var ev = Object.assign({}, e, { type: e.a, by: w.me }); delete ev.a;
      if (e.a === 'merge') ev.ok = res === true;
      w.event(ev);
      return res;
    }
    if (e.ev) { w.event(Object.assign({ by: w.me }, e.ev)); return null; }
    return V.applyShell(w, e);
  }

  // ---------- widget ----------
  TDC.widgets.register('github', function (host, cfg, ctx) {
    var S = V.session(cfg, ctx, applyAll), w;
    var route = cfg.start || '/', back = [], ui = {};
    var page = el('div', { class: 'gh-page' });
    // pages pass optional parts as `cond ? x : null`; native append would print "null"
    page.append = function () { Element.prototype.append.apply(page, [].filter.call(arguments, function (x) { return x != null; })); };
    var addr = el('span', { class: 'gh-url' });
    var overlay = el('div', { class: 'gui-overlay' });
    var personaBox = el('div', { class: 'gh-persona' });
    var browser = el('div', { class: 'gh-browser', style: cfg.height ? { minHeight: cfg.height + 'px' } : null }, [
      el('div', { class: 'gh-chrome' }, [
        el('button', { class: 'gh-nav', 'aria-label': T('gh.back'), onclick: function () { if (back.length) { route = back.pop(); render(); } } }, '←'),
        el('div', { class: 'gh-addr' }, [el('span', { 'aria-hidden': 'true' }, '🔒 '), el('span', { class: 'muted' }, 'github.com'), addr])
      ]),
      el('div', { class: 'gh-top' }), page
    ]);
    var tasks = V.tasks(cfg.tasks, ctx, function () { return w; });
    var termBox = el('div');
    var term = cfg.terminal ? V.terminalView({ S: S, title: 'Git Bash', onChange: function () { render(true); } }) : null;
    if (term) termBox.append(el('h3', { class: 'panel-title gh-term-title' }, T('gh.yourComputer')), term.node);
    var resetBtn = el('button', { class: 'btn btn-small btn-ghost', onclick: function () {
      TDC.ui.confirm(T('sim.resetTitle'), T('sim.resetBody'), T('sim.reset')).then(function (ok) { if (ok) { w = S.reset(); w.me = cfg.world && cfg.world.me || 'student'; route = cfg.start || '/'; back = []; if (term) term.boot(); render(); } });
    } }, '↺ ' + T('sim.reset'));
    host.classList.add('sim-github');
    host.append(tasks, personaBox, el('div', { class: 'gui-stage' }, [browser, overlay]), termBox, el('div', { class: 'sim-actions' }, [resetBtn]));

    function act(name, args) { var e = Object.assign({ a: name }, args || {}); var r = S.act(e); return r; }
    function go(path) { if (path !== route) back.push(route); route = path; S.act({ ev: { type: 'visit', path: path } }); render(); host.scrollIntoView({ block: 'nearest' }); }
    function click(id) { S.act({ ev: { type: 'click', id: id } }); tasks.refresh(); }
    function link(path, kids, attrs) { return el('a', Object.assign({ href: '#', class: 'gh-link', onclick: function (e) { e.preventDefault(); go(path); } }, attrs || {}), kids); }
    function btn(label, onclick, cls, attrs) { return el('button', Object.assign({ class: 'gh-btn ' + (cls || ''), onclick: onclick }, attrs || {}), label); }
    // with action/slug the refusal is logged (tasks can check it) and the task list refreshed
    function denied(msg, action, slug) { if (action) { S.act({ ev: { type: 'denied', action: action, slug: slug } }); tasks.refresh(); } TDC.ui.toast(msg, 'warn', 4500); }
    function me() { return w.server.users[w.me] || { login: w.me, name: w.me, keys: [], tokens: [] }; }
    function avatar(login, big) { return el('span', { class: 'gh-av' + (big ? ' big' : ''), 'aria-hidden': 'true', style: { '--h': (login || '?').split('').reduce(function (s, c) { return s + c.charCodeAt(0); }, 0) % 360 } }, (login || '?')[0].toUpperCase()); }
    function md(text) { return el('div', { class: 'gh-md', html: V.md(text) }); }
    function role(slug) { return w.roleOf(w.me, slug); }
    function can(slug, action) { return w.can(w.me, slug, action) === true; }
    function plural(n, word) { return n + ' ' + word + (n === 1 ? '' : 's'); }
    function counter(n) { return el('span', { class: 'gh-counter' }, String(n)); }
    function time(t) { return w.fmtTime(t).slice(4, 10); }

    // ---------- persona switcher (teaching tool, outside the fake browser) ----------
    function renderPersona() {
      personaBox.innerHTML = '';
      var ps = cfg.personas || [];
      if (ps.length < 2) return;
      personaBox.append(el('span', { class: 'gh-persona-label' }, T('gh.viewingAs')), el('div', { class: 'gh-persona-list', role: 'group', 'aria-label': T('gh.viewingAs') }, ps.map(function (p) {
        var u = w.server.users[p] || { name: p };
        return el('button', { class: 'gh-persona-btn' + (p === w.me ? ' on' : ''), 'aria-pressed': String(p === w.me), onclick: function () { if (p !== w.me) { act('as', { login: p }); render(); } } }, [avatar(p), ' ', u.name + ' (' + p + ')']);
      })));
    }

    // ---------- header ----------
    function renderTop() {
      var top = browser.querySelector('.gh-top'); top.innerHTML = '';
      if (/^\/signup/.test(route)) {   // signed out: GitHub's header has no search, menus or avatar
        top.append(link('/', [el('span', { class: 'gh-mark', 'aria-hidden': 'true' }), el('span', { class: 'sr-only' }, 'GitHub')], { class: 'gh-logo', 'aria-label': 'GitHub home' }), el('span', { class: 'gh-grow' }), el('span', { class: 'muted small' }, 'Already have an account? Sign in →'));
        return;
      }
      var invites = Object.keys(w.server.orgs).filter(function (o) { return w.server.orgs[o].invites.some(function (i) { return i.login === w.me; }); });
      top.append(
        link('/', [el('span', { class: 'gh-mark', 'aria-hidden': 'true' }), el('span', { class: 'sr-only' }, 'GitHub')], { class: 'gh-logo', 'aria-label': 'GitHub home' }),
        el('span', { class: 'gh-crumb' }, crumbFor(route)),
        el('span', { class: 'gh-search', 'aria-hidden': 'true' }, T('gh.search')),
        el('button', { class: 'gh-icon', 'aria-label': T('gh.createNew'), onclick: function (e) {
          click('plus-menu');
          TDC.ui.popover(e.currentTarget, el('div', { class: 'gui-menu' }, [
            el('button', { class: 'gui-menu-item', onclick: function () { TDC.ui.closePopover(); go('/new'); } }, T('gh.newRepo')),
            el('button', { class: 'gui-menu-item', onclick: function () { TDC.ui.closePopover(); denied(T('gh.notInSim')); } }, T('gh.newOrg'))
          ]));
        } }, '+ ▾'),
        el('button', { class: 'gh-icon' + (invites.length ? ' has-dot' : ''), 'aria-label': T('gh.notifications'), onclick: function () {
          click('notifications');
          if (invites.length) go('/orgs/' + invites[0] + '/invitation'); else TDC.ui.toast(T('gh.noNotifications'));
        } }, '🔔'),
        el('button', { class: 'gh-icon gh-me', 'aria-label': T('gh.userMenu'), onclick: function (e) {
          click('avatar-menu');
          var orgs = Object.keys(w.server.orgs).filter(function (o) { var g = w.server.orgs[o]; return g.owners.concat(g.members).indexOf(w.me) >= 0; });
          TDC.ui.popover(e.currentTarget, el('div', { class: 'gui-menu' }, [el('div', { class: 'gui-menu-h' }, (me().name || w.me) + ' · ' + w.me)].concat(
            orgs.map(function (o) { return el('button', { class: 'gui-menu-item', onclick: function () { TDC.ui.closePopover(); go('/orgs/' + o); } }, '🏢 ' + o); }),
            [['/settings/security', T('gh.passwordAuth')], ['/settings/keys', T('gh.sshKeys')], ['/settings/tokens', T('gh.devSettings')]].map(function (x) {
              return el('button', { class: 'gui-menu-item', onclick: function () { TDC.ui.closePopover(); go(x[0]); } }, x[1]);
            }))));
        } }, avatar(w.me))
      );
    }
    function crumbFor(r) { var p = r.split('/').filter(Boolean); if (p[0] === 'orgs') return p[1] || ''; if (p.length >= 2 && w.server.repos[p[0] + '/' + p[1]]) return p[0] + ' / ' + p[1]; return ''; }

    // ---------- pages ----------
    function render(keepScroll) {
      addr.textContent = route === '/' ? '' : route;
      renderPersona(); renderTop();
      page.innerHTML = '';
      var p = route.split('/').filter(Boolean);
      try {
        if (!p.length) homePage();
        else if (p[0] === 'signup') signupPage();
        else if (p[0] === 'new') newRepoPage();
        else if (p[0] === 'settings') userSettings(p[1] || 'security');
        else if (p[0] === 'orgs') orgPage(p[1], p[2] || 'overview', p.slice(3));
        else if (w.server.repos[p[0] + '/' + p[1]]) repoPage(p[0] + '/' + p[1], p[2] || 'code', p.slice(3));
        else if (w.server.orgs[p[0]]) { route = '/orgs/' + p[0]; return render(); }
        else notFound();
      } catch (err) { console.error(err); page.append(el('p', { class: 'blk-error' }, '⚠ ' + err.message)); }
      tasks.refresh();
      if (term) term.refresh();
    }
    function notFound() {
      page.append(el('div', { class: 'gh-404' }, [el('h2', {}, '404'), el('p', {}, T('gh.notFound')), el('p', { class: 'muted small' }, T('gh.notFoundWhy'))]));
    }
    function homePage() {
      var repos = Object.keys(w.server.repos).filter(function (s) { return role(s) !== 'none'; });
      page.append(el('div', { class: 'gh-home' }, [el('h2', {}, T('gh.dashboard')), el('div', { class: 'gh-box' }, [el('div', { class: 'gh-box-h' }, [el('strong', {}, T('gh.topRepos')), btn('＋ ' + T('gh.new'), function () { go('/new'); }, 'gh-green')]),
        el('ul', { class: 'gh-rows' }, repos.map(function (s) { return el('li', {}, [avatar(s.split('/')[0]), ' ', link('/' + s, s)]); }))])]));
    }

    // ----- sign-up -----
    function signupPage() {
      var email = el('input', { class: 'input', type: 'email', 'aria-label': 'Email', autocomplete: 'email' }), pass = el('input', { class: 'input', type: 'password', 'aria-label': 'Password', autocomplete: 'new-password' });
      var user = el('input', { class: 'input', 'aria-label': 'Username', autocomplete: 'username' }), msg = el('p', { class: 'gh-form-msg', 'aria-live': 'polite' });
      function create() {
        var l = user.value.trim();
        if (!/^\S+@\S+\.\S+$/.test(email.value)) { msg.textContent = T('gh.badEmail'); return; }
        if (pass.value.length < 15 && !(pass.value.length >= 8 && /\d/.test(pass.value) && /[a-z]/.test(pass.value))) { msg.textContent = T('gh.weakPassword'); return; }
        if (!/^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/i.test(l)) { msg.textContent = T('gh.badUsername'); return; }
        if (w.server.users[l] || w.server.orgs[l]) { msg.textContent = T('gh.usernameTaken', { u: l }); return; }
        act('signup', { login: l, email: email.value.trim() }); go('/');
        TDC.ui.toast(T('gh.welcome', { u: l }), 'ok');
      }
      page.append(el('form', { class: 'gh-narrow', onsubmit: function (e) { e.preventDefault(); create(); } }, [el('h2', {}, T('gh.signupTitle')), el('p', { class: 'muted small' }, T('gh.signupNote')),
        el('label', { class: 'field' }, [el('span', {}, 'Email*'), email]), el('label', { class: 'field' }, [el('span', {}, 'Password*'), pass]),
        el('p', { class: 'muted small' }, T('gh.passwordRule')), el('label', { class: 'field' }, [el('span', {}, 'Username*'), user]),
        el('p', { class: 'muted small' }, T('gh.usernameRule')), msg, btn(T('gh.continue'), null, 'gh-green gh-wide', { type: 'submit' })]));
    }

    // ----- user settings -----
    function settingsNav(cur) {
      return el('nav', { class: 'gh-sidenav' }, [['security', T('gh.passwordAuth')], ['keys', T('gh.sshKeys')], ['tokens', T('gh.tokens')]].map(function (x) {
        return link('/settings/' + x[0], x[1], { class: 'gh-sidelink' + (cur === x[0] ? ' on' : '') });
      }));
    }
    function userSettings(sec) {
      var body = el('div', { class: 'gh-settings-body' }), u = me();
      if (sec === 'security') {
        body.append(el('h2', {}, T('gh.twofaTitle')));
        if (u.twofa) body.append(el('p', { class: 'gh-flash ok' }, '✓ ' + T('gh.twofaOn')));
        else {
          var step = ui.twofaStep || 0;
          if (!step) body.append(el('p', {}, T('gh.twofaIntro')), btn(T('gh.twofaEnable'), function () { ui.twofaStep = 1; render(); }, 'gh-green'));
          else if (step === 1) {
            var code = el('input', { class: 'input gh-code', inputmode: 'numeric', maxlength: 6, 'aria-label': T('gh.twofaCode') });
            body.append(el('div', { class: 'gh-qr', 'aria-hidden': 'true' }), el('p', {}, T('gh.twofaScan')), el('label', { class: 'field' }, [el('span', {}, T('gh.twofaCode')), code]),
              btn(T('gh.continue'), function () { if (!/^\d{6}$/.test(code.value)) { denied(T('gh.twofaBadCode')); return; } ui.twofaStep = 2; render(); }, 'gh-green'));
          } else {
            body.append(el('h3', {}, T('gh.recoveryTitle')), el('p', {}, T('gh.recoveryText')), el('pre', { class: 'gh-codes' }, 'a1b2c-3d4e5  f6g7h-8i9j0\nk1l2m-3n4o5  p6q7r-8s9t0\nu1v2w-3x4y5  z6a7b-8c9d0'),
              btn(T('gh.recoveryDone'), function () { ui.twofaStep = 0; act('twofa'); render(); TDC.ui.toast(T('gh.twofaOn'), 'ok'); }, 'gh-green'));
          }
        }
      } else if (sec === 'keys') {
        body.append(el('div', { class: 'gh-box-h' }, [el('h2', {}, T('gh.sshKeys')), btn(T('gh.newSshKey'), function () { ui.newKey = true; click('new-ssh-key'); render(); }, 'gh-green')]));
        if (ui.newKey) {
          var title = el('input', { class: 'input', 'aria-label': 'Title', placeholder: 'Work laptop' }), key = el('textarea', { class: 'input gh-mono', rows: 4, 'aria-label': 'Key', placeholder: T('gh.keyPh') });
          body.append(el('div', { class: 'gh-box gh-pad' }, [el('label', { class: 'field' }, [el('span', {}, 'Title'), title]), el('p', { class: 'small' }, 'Key type: Authentication Key'),
            el('label', { class: 'field' }, [el('span', {}, 'Key'), key]),
            btn(T('gh.addSshKey'), function () {
              var k = key.value.trim();
              if (/PRIVATE KEY/.test(k)) { denied(T('gh.privateKeyWarn')); return; }
              if (!/^(ssh-ed25519|ssh-rsa|ecdsa-sha2-\S+) \S+/.test(k)) { denied(T('gh.badKey')); return; }
              act('sshKey', { title: title.value.trim() || 'My key', key: k }); ui.newKey = false; render();
            }, 'gh-green')]));
        }
        body.append(u.keys.length ? el('ul', { class: 'gh-rows gh-box' }, u.keys.map(function (k, i) {
          return el('li', { class: 'gh-row' }, [el('span', { class: 'gh-key-icon', 'aria-hidden': 'true' }, '🔑'), el('div', {}, [el('strong', {}, k.title), el('div', { class: 'muted small gh-mono' }, 'SHA256:' + k.key.slice(26, 50))]), btn(T('gh.delete'), function () { act('sshKeyDelete', { i: i }); render(); }, 'gh-danger')]);
        })) : el('p', { class: 'muted' }, T('gh.noKeys')));
      } else {
        body.append(el('div', { class: 'gh-box-h' }, [el('h2', {}, T('gh.tokens')), btn(T('gh.genToken'), function () { ui.newToken = true; click('generate-token'); render(); }, 'gh-green')]));
        if (ui.newToken) {
          var name = el('input', { class: 'input', 'aria-label': T('gh.tokenName') });
          var exp = el('select', { class: 'input', 'aria-label': T('gh.expiration') }, [['7', '7 days'], ['30', '30 days'], ['60', '60 days'], ['90', '90 days'], ['0', 'No expiration']].map(function (x) { return el('option', { value: x[0] }, x[1]); }));
          var mine = Object.keys(w.server.repos).filter(function (s) { return can(s, 'push'); });
          var scopeAll = el('input', { type: 'radio', name: 'tok-scope', value: 'all' }), scopeSel = el('input', { type: 'radio', name: 'tok-scope', value: 'sel', checked: true });
          var pick = el('select', { class: 'input', 'aria-label': T('gh.selectRepos'), multiple: true, size: Math.min(4, mine.length || 1) }, mine.map(function (s) { return el('option', { value: s }, s); }));
          var perm = el('select', { class: 'input', 'aria-label': 'Contents' }, [['read', 'Read-only'], ['write', 'Read and write']].map(function (x) { return el('option', { value: x[0] }, x[1]); }));
          body.append(el('div', { class: 'gh-box gh-pad' }, [el('p', { class: 'small muted' }, 'Fine-grained personal access token'),
            el('label', { class: 'field' }, [el('span', {}, T('gh.tokenName')), name]), el('label', { class: 'field' }, [el('span', {}, T('gh.expiration')), exp]),
            el('fieldset', { class: 'gh-fs' }, [el('legend', {}, T('gh.repoAccess')), el('label', { class: 'gui-check' }, [scopeAll, ' All repositories']), el('label', { class: 'gui-check' }, [scopeSel, ' Only select repositories']), pick]),
            el('label', { class: 'field' }, [el('span', {}, T('gh.permContents')), perm]),
            btn(T('gh.genToken'), function () {
              if (!name.value.trim()) { denied(T('gh.needName')); return; }
              var repos = scopeAll.checked ? ['*'] : Array.prototype.filter.call(pick.options, function (o) { return o.selected; }).map(function (o) { return o.value; });
              if (!scopeAll.checked && !repos.length) { denied(T('gh.pickRepo')); return; }
              act('token', { name: name.value.trim(), days: +exp.value, repos: repos, perm: perm.value }); ui.newToken = false; ui.shownToken = 'github_pat_11A' + Math.random().toString(36).slice(2, 12).toUpperCase() + '_x'; render();
            }, 'gh-green')]));
        }
        if (ui.shownToken) body.append(el('div', { class: 'gh-flash ok' }, [el('p', {}, T('gh.copyTokenNow')), el('code', { class: 'gh-mono' }, ui.shownToken)]));
        body.append(u.tokens.length ? el('ul', { class: 'gh-rows gh-box' }, u.tokens.map(function (k) {
          return el('li', { class: 'gh-row' }, [el('strong', {}, k.name), el('span', { class: 'muted small' }, (k.days ? T('gh.expiresIn', { n: k.days }) : T('gh.noExpiry')) + ' · ' + (k.repos[0] === '*' ? 'All repositories' : k.repos.join(', ')) + ' · contents: ' + k.perm)]);
        })) : el('p', { class: 'muted' }, T('gh.noTokens')));
      }
      page.append(el('div', { class: 'gh-settings' }, [el('div', {}, [el('div', { class: 'gh-settings-who' }, [avatar(w.me, true), el('div', {}, [el('strong', {}, me().name || w.me), el('div', { class: 'muted small' }, T('gh.personalAccount'))])]), settingsNav(sec)]), body]));
    }

    // ----- new repository -----
    function newRepoPage() {
      var owners = [w.me].concat(Object.keys(w.server.orgs).filter(function (o) { var g = w.server.orgs[o]; return g.owners.indexOf(w.me) >= 0 || (g.members.indexOf(w.me) >= 0 && g.settings.membersCanCreate); }));
      var templates = Object.keys(w.server.repos).filter(function (s) { return w.server.repos[s].template && role(s) !== 'none'; });
      var tpl = el('select', { class: 'input', 'aria-label': 'Repository template' }, [el('option', { value: '' }, 'No template')].concat(templates.map(function (s) { return el('option', { value: s }, s); })));
      var owner = el('select', { class: 'input', 'aria-label': 'Owner' }, owners.map(function (o) { return el('option', { value: o, selected: ui.newOwner === o ? true : null }, o); }));
      var name = el('input', { class: 'input', 'aria-label': 'Repository name' });
      var desc = el('input', { class: 'input', 'aria-label': 'Description' });
      var pub = el('input', { type: 'radio', name: 'vis', value: 'public' }), priv = el('input', { type: 'radio', name: 'vis', value: 'private', checked: true });
      var readme = el('input', { type: 'checkbox' });
      var gi = el('select', { class: 'input', 'aria-label': '.gitignore template' }, ['None', 'Python', 'Node', 'TeX', 'Java'].map(function (x) { return el('option', { value: x }, x); }));
      var lic = el('select', { class: 'input', 'aria-label': 'License' }, ['None', 'MIT', 'Apache-2.0', 'GPL-3.0', 'CC-BY-4.0'].map(function (x) { return el('option', { value: x }, x); }));
      var hint = el('p', { class: 'small', 'aria-live': 'polite' });
      name.addEventListener('input', function () {
        var n = name.value.trim().replace(/[^\w.-]+/g, '-'), taken = w.server.repos[owner.value + '/' + n];
        hint.textContent = !n ? '' : taken ? '✗ ' + T('gh.nameTaken', { n: n }) : (n !== name.value.trim() ? T('gh.nameWillBe', { n: n }) + ' ' : '') + '✓ ' + T('gh.nameOk', { n: n });
        hint.className = 'small ' + (taken ? 'bad' : 'ok');
      });
      var GI = { Python: '__pycache__/\n*.pyc\n.venv/\n.env\n', Node: 'node_modules/\ndist/\n.env\n', TeX: '*.aux\n*.log\n*.out\n*.toc\n*.synctex.gz\n', Java: '*.class\ntarget/\n' };
      page.append(el('div', { class: 'gh-narrow' }, [el('h2', {}, T('gh.createRepoTitle')), el('p', { class: 'muted small' }, T('gh.createRepoSub')),
        el('label', { class: 'field' }, [el('span', {}, 'Repository template'), tpl]),
        el('div', { class: 'gh-owner-row' }, [el('label', { class: 'field' }, [el('span', {}, 'Owner *'), owner]), el('span', { class: 'gh-slash' }, '/'), el('label', { class: 'field' }, [el('span', {}, 'Repository name *'), name])]), hint,
        el('label', { class: 'field' }, [el('span', {}, 'Description (optional)'), desc]),
        el('fieldset', { class: 'gh-fs' }, [el('legend', {}, T('gh.visibility')),
          el('label', { class: 'gui-check' }, [pub, ' 🌐 Public — ' + T('gh.publicDesc')]), el('label', { class: 'gui-check' }, [priv, ' 🔒 Private — ' + T('gh.privateDesc')])]),
        el('fieldset', { class: 'gh-fs' }, [el('legend', {}, 'Initialize this repository with:'), el('label', { class: 'gui-check' }, [readme, ' Add a README file']),
          el('label', { class: 'field' }, [el('span', {}, 'Add .gitignore'), gi]), el('label', { class: 'field' }, [el('span', {}, 'Choose a license'), lic])]),
        btn(T('gh.createRepo'), function () {
          var n = name.value.trim().replace(/[^\w.-]+/g, '-');
          if (!n) { denied(T('gh.needName')); return; }
          if (w.server.repos[owner.value + '/' + n]) { denied(T('gh.nameTaken', { n: n })); return; }
          var o = w.server.orgs[owner.value];
          if (o && pub.checked && !o.settings.membersCanCreatePublic && o.owners.indexOf(w.me) < 0) { denied(T('gh.noPublicCreate')); return; }
          act('repoCreate', { owner: owner.value, name: n, description: desc.value.trim(), visibility: pub.checked ? 'public' : 'private', template: tpl.value || null, readme: readme.checked, gitignore: GI[gi.value] || null, license: lic.value !== 'None' ? lic.value : null });
          go('/' + owner.value + '/' + n);
        }, 'gh-green')]));
    }

    // ----- organization -----
    function orgPage(org, tab, rest) {
      var o = w.server.orgs[org];
      if (!o) return notFound();
      var owner = o.owners.indexOf(w.me) >= 0, member = owner || o.members.indexOf(w.me) >= 0;
      if (tab === 'invitation') return invitationPage(org, o);
      var tabs = [['overview', 'Overview'], ['repositories', 'Repositories'], ['teams', 'Teams'], ['people', 'People']].concat(owner ? [['settings', 'Settings']] : []);
      page.append(el('div', { class: 'gh-org-head' }, [el('span', { class: 'gh-av big sq', 'aria-hidden': 'true' }, org[0].toUpperCase()), el('div', {}, [el('h2', {}, o.displayName), el('div', { class: 'muted small' }, '@' + org + (member ? ' · ' + T(owner ? 'gh.youAreOwner' : 'gh.youAreMember') : ''))])]),
        el('nav', { class: 'gh-tabs' }, tabs.map(function (t) { return link('/orgs/' + org + (t[0] === 'overview' ? '' : '/' + t[0]), t[1], { class: 'gh-tab' + (tab === t[0] ? ' on' : ''), 'data-id': 'org-tab-' + t[0] }); })));
      if (tab === 'overview' || tab === 'repositories') {
        var repos = Object.keys(w.server.repos).filter(function (s) { return s.indexOf(org + '/') === 0 && role(s) !== 'none'; });
        var canCreate = owner || (member && o.settings.membersCanCreate);
        page.append(el('div', { class: 'gh-box' }, [el('div', { class: 'gh-box-h' }, [el('strong', {}, 'Repositories'), canCreate ? btn('＋ ' + T('gh.new'), function () { ui.newOwner = org; go('/new'); }, 'gh-green') : null]),
          repos.length ? el('ul', { class: 'gh-rows' }, repos.map(function (s) {
            var r = w.server.repos[s];
            return el('li', { class: 'gh-row' }, [el('div', {}, [link('/' + s, r.name, { class: 'gh-link gh-strong' }), ' ', el('span', { class: 'gh-label' }, visLabel(r)), r.archived ? el('span', { class: 'gh-label warn' }, 'Archived') : null, r.template ? el('span', { class: 'gh-label' }, 'Template') : null,
              el('div', { class: 'muted small' }, r.description || '')]), el('span', { class: 'muted small' }, T('gh.yourRole') + ': ' + ROLE_LABEL[role(s)])]);
          })) : el('p', { class: 'muted gh-pad' }, member ? T('gh.noReposVisible') : T('gh.notMemberRepos'))]));
      } else if (tab === 'people') orgPeople(org, o, owner);
      else if (tab === 'teams') orgTeams(org, o, owner, rest);
      else if (tab === 'settings') { if (!owner) return notFound(); orgSettings(org, o, rest[0] || 'privileges'); }
    }
    function invitationPage(org, o) {
      var inv = o.invites.filter(function (i) { return i.login === w.me; })[0];
      if (!inv) { page.append(el('p', { class: 'gh-pad' }, T('gh.noInvite'))); return; }
      page.append(el('div', { class: 'gh-narrow gh-center' }, [el('span', { class: 'gh-av big sq', 'aria-hidden': 'true' }, org[0].toUpperCase()),
        el('h2', {}, T('gh.invitedTo', { org: o.displayName })), el('p', { class: 'muted' }, T('gh.invitedRole', { role: inv.role === 'owner' ? 'owner' : 'member' })),
        el('p', { class: 'small' }, T('gh.joinNote')),
        el('div', { class: 'btn-row gh-center' }, [btn(T('gh.join', { org: o.displayName }), function () { act('join', { org: org }); go('/orgs/' + org); TDC.ui.toast(T('gh.joined'), 'ok'); }, 'gh-green'),
          btn(T('gh.decline'), function () { o.invites = o.invites.filter(function (i) { return i.login !== w.me; }); render(); })])]));
    }
    function orgPeople(org, o, owner) {
      var sub = ui.peopleTab || 'members';
      var tabs = el('div', { class: 'gh-subtabs' }, [['members', 'Members', o.owners.length + o.members.length], ['outside', 'Outside collaborators', o.outside.length], ['pending', 'Pending invitations', o.invites.length]].map(function (x) {
        return btn([x[1] + ' ', counter(x[2])], function () { ui.peopleTab = x[0]; render(); }, 'gh-subtab' + (sub === x[0] ? ' on' : ''));
      }));
      var box = el('div', { class: 'gh-box' }, [el('div', { class: 'gh-box-h' }, [tabs, owner ? btn(T('gh.inviteMember'), function () { click('invite-member'); inviteDialog(org); }, 'gh-green') : null])]);
      if (sub === 'members') box.append(el('ul', { class: 'gh-rows' }, o.owners.map(function (l) { return [l, 'owner']; }).concat(o.members.map(function (l) { return [l, 'member']; })).map(function (x) {
        var u = w.server.users[x[0]] || { name: x[0] }, tfa = u.twofa;
        var roleSel = owner && x[0] !== w.me ? el('select', { class: 'input gh-mini', 'aria-label': T('gh.roleOf', { u: x[0] }), onchange: function () { act('orgRole', { org: org, login: x[0], role: roleSel.value }); render(); } },
          [['member', 'Member'], ['owner', 'Owner']].map(function (r) { return el('option', { value: r[0], selected: r[0] === x[1] ? true : null }, r[1]); })) : el('span', { class: 'gh-label' }, x[1] === 'owner' ? 'Owner' : 'Member');
        return el('li', { class: 'gh-row' }, [avatar(x[0]), el('div', {}, [el('strong', {}, u.name), el('div', { class: 'muted small' }, x[0] + (tfa ? ' · 2FA ✓' : ' · 2FA ✗'))]), roleSel,
          owner && x[0] !== w.me ? btn('⋯', function (e) {
            TDC.ui.popover(e.currentTarget, el('div', { class: 'gui-menu' }, [
              o.owners.indexOf(x[0]) < 0 ? el('button', { class: 'gui-menu-item', onclick: function () { TDC.ui.closePopover(); act('removeMember', { org: org, login: x[0], outside: true }); render(); TDC.ui.toast(T('gh.convertedOutside', { u: x[0] }), 'ok'); } }, T('gh.convertOutside')) : null,
              el('button', { class: 'gui-menu-item gh-danger-text', onclick: function () { TDC.ui.closePopover(); confirmDialog(T('gh.removeTitle', { u: x[0] }), T('gh.removeBody', { u: x[0], org: org }), T('gh.removeMember'), function () { act('removeMember', { org: org, login: x[0] }); render(); }); } }, T('gh.removeMember'))
            ]));
          }, 'gh-mini-btn', { 'aria-label': T('gh.memberActions', { u: x[0] }) }) : null]);
      })));
      else if (sub === 'outside') box.append(o.outside.length ? el('ul', { class: 'gh-rows' }, o.outside.map(function (l) {
        var access = Object.keys(w.server.repos).filter(function (s) { return s.indexOf(org + '/') === 0 && w.server.repos[s].collaborators[l]; });
        return el('li', { class: 'gh-row' }, [avatar(l), el('div', {}, [el('strong', {}, l), el('div', { class: 'muted small' }, access.length ? access.map(function (s) { return s.split('/')[1] + ' (' + w.server.repos[s].collaborators[l] + ')'; }).join(', ') : T('gh.noAccessLeft'))]),
          owner ? btn(T('gh.removeAccess'), function () {
            confirmDialog(T('gh.removeAccess') + ': ' + l, T('gh.removeAccessBody', { u: l, org: org }), T('gh.removeAccess'), function () { act('removeMember', { org: org, login: l }); render(); });
          }, 'gh-danger', { 'data-id': 'remove-access-' + l }) : null]);
      })) : el('p', { class: 'muted gh-pad' }, T('gh.noOutside')));
      else box.append(o.invites.length ? el('ul', { class: 'gh-rows' }, o.invites.map(function (i) { return el('li', { class: 'gh-row' }, [avatar(i.login), el('strong', {}, i.login), el('span', { class: 'muted small' }, T('gh.invitedAs', { role: i.role }))]); })) : el('p', { class: 'muted gh-pad' }, T('gh.noInvites')));
      page.append(box);
    }
    function inviteDialog(org) {
      var login = el('input', { class: 'input', 'aria-label': T('gh.usernameOrEmail'), placeholder: 'ben' });
      var r = el('select', { class: 'input', 'aria-label': 'Role' }, [['member', 'Member'], ['owner', 'Owner']].map(function (x) { return el('option', { value: x[0] }, x[1]); }));
      V.dialog(overlay, T('gh.inviteMember'), el('div', { class: 'gui-form' }, [el('label', { class: 'field' }, [el('span', {}, T('gh.usernameOrEmail')), login]), el('label', { class: 'field' }, [el('span', {}, 'Role in the organization'), r]),
        el('p', { class: 'muted small' }, T('gh.roleHelp'))]), [{ label: T('common.cancel') }, { label: T('gh.sendInvite'), primary: true, run: function () {
          var l = login.value.trim().replace(/^@/, ''), o = w.server.orgs[org];
          if (!l) return false;
          if (o.owners.concat(o.members).indexOf(l) >= 0) { denied(T('gh.alreadyMember', { u: l })); return false; }
          if (o.invites.some(function (i) { return i.login === l; })) { denied(T('gh.alreadyInvited', { u: l })); return false; }
          act('invite', { org: org, login: l, role: r.value }); ui.peopleTab = 'pending'; render();
        } }]);
    }
    function orgTeams(org, o, owner, rest) {
      if (rest[0] && o.teams[rest[0]]) return teamPage(org, o, rest[0], owner);
      var box = el('div', { class: 'gh-box' }, [el('div', { class: 'gh-box-h' }, [el('strong', {}, Object.keys(o.teams).length + ' teams'), owner ? btn(T('gh.newTeam'), function () { click('new-team'); newTeamDialog(org, o); }, 'gh-green') : null])]);
      box.append(Object.keys(o.teams).length ? el('ul', { class: 'gh-rows' }, Object.keys(o.teams).map(function (t) {
        var tm = o.teams[t];
        return el('li', { class: 'gh-row' }, [el('div', {}, [link('/orgs/' + org + '/teams/' + t, tm.name, { class: 'gh-link gh-strong' }), tm.parent ? el('span', { class: 'muted small' }, ' (' + T('gh.childOf', { p: o.teams[tm.parent] ? o.teams[tm.parent].name : tm.parent }) + ')') : null, el('div', { class: 'muted small' }, tm.description || '')]),
          el('span', { class: 'muted small' }, tm.members.length + ' members · ' + Object.keys(tm.repos).length + ' repositories')]);
      })) : el('p', { class: 'muted gh-pad' }, T('gh.noTeams')));
      page.append(box);
    }
    function newTeamDialog(org, o) {
      var name = el('input', { class: 'input', 'aria-label': 'Team name', placeholder: 'Thesis 2026' }), desc = el('input', { class: 'input', 'aria-label': 'Description' });
      var parent = el('select', { class: 'input', 'aria-label': 'Parent team' }, [el('option', { value: '' }, 'No parent')].concat(Object.keys(o.teams).map(function (t) { return el('option', { value: t }, o.teams[t].name); })));
      V.dialog(overlay, T('gh.newTeam'), el('div', { class: 'gui-form' }, [el('label', { class: 'field' }, [el('span', {}, 'Team name'), name]), el('label', { class: 'field' }, [el('span', {}, 'Description'), desc]), el('label', { class: 'field' }, [el('span', {}, 'Parent team'), parent])]),
        [{ label: T('common.cancel') }, { label: T('gh.createTeam'), primary: true, run: function () {
          var n = name.value.trim(); if (!n) return false;
          var slug = n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          if (o.teams[slug]) { denied(T('gh.teamExists')); return false; }
          act('teamCreate', { org: org, slug: slug, name: n, description: desc.value.trim(), parent: parent.value || null }); go('/orgs/' + org + '/teams/' + slug);
        } }]);
    }
    function teamPage(org, o, t, owner) {
      var tm = o.teams[t];
      var orgRepos = Object.keys(w.server.repos).filter(function (s) { return s.indexOf(org + '/') === 0; });
      var addM = el('select', { class: 'input gh-mini', 'aria-label': T('gh.addMember') }, [el('option', { value: '' }, T('gh.addMember') + '…')].concat(o.owners.concat(o.members).filter(function (l) { return tm.members.indexOf(l) < 0; }).map(function (l) { return el('option', { value: l }, l); })));
      addM.addEventListener('change', function () { if (addM.value) { act('teamMember', { org: org, team: t, login: addM.value, add: true }); render(); } });
      var addR = el('select', { class: 'input gh-mini', 'aria-label': T('gh.addRepo') }, [el('option', { value: '' }, T('gh.addRepo') + '…')].concat(orgRepos.filter(function (s) { return !tm.repos[s]; }).map(function (s) { return el('option', { value: s }, s.split('/')[1]); })));
      addR.addEventListener('change', function () { if (addR.value) { act('teamRepo', { org: org, team: t, slug: addR.value, role: 'read' }); render(); } });
      page.append(el('div', { class: 'gh-team-head' }, [link('/orgs/' + org + '/teams', '← Teams'), el('h3', {}, tm.name), el('p', { class: 'muted small' }, tm.description)]),
        el('div', { class: 'gh-two' }, [
          el('div', { class: 'gh-box' }, [el('div', { class: 'gh-box-h' }, [el('strong', {}, 'Members'), owner ? addM : null]),
            el('ul', { class: 'gh-rows' }, tm.members.map(function (l) { return el('li', { class: 'gh-row' }, [avatar(l), el('strong', {}, l), owner ? btn(T('gh.remove'), function () { act('teamMember', { org: org, team: t, login: l, add: false }); render(); }, 'gh-mini-btn') : null]); }))]),
          el('div', { class: 'gh-box' }, [el('div', { class: 'gh-box-h' }, [el('strong', {}, 'Repositories'), owner ? addR : null]),
            el('ul', { class: 'gh-rows' }, Object.keys(tm.repos).map(function (s) {
              var sel = el('select', { class: 'input gh-mini', disabled: owner ? null : true, 'aria-label': T('gh.teamRoleOn', { r: s }), onchange: function () { act('teamRepo', { org: org, team: t, slug: s, role: sel.value }); render(); } },
                ['read', 'triage', 'write', 'maintain', 'admin'].map(function (r) { return el('option', { value: r, selected: tm.repos[s] === r ? true : null }, ROLE_LABEL[r]); }));
              return el('li', { class: 'gh-row' }, [link('/' + s, s.split('/')[1]), sel, owner ? btn(T('gh.remove'), function () { act('teamRepo', { org: org, team: t, slug: s, role: null }); render(); }, 'gh-mini-btn') : null]);
            }))])
        ]));
    }
    function orgSettings(org, o, sec) {
      var nav = el('nav', { class: 'gh-sidenav' }, [['privileges', 'Member privileges'], ['security', 'Authentication security'], ['audit', 'Audit log']].map(function (x) {
        return link('/orgs/' + org + '/settings/' + x[0], x[1], { class: 'gh-sidelink' + (sec === x[0] ? ' on' : '') });
      }));
      var body = el('div', { class: 'gh-settings-body' }), s = o.settings;
      function check(key, label, help) {
        var cb = el('input', { type: 'checkbox', checked: s[key] ? true : null, onchange: function () { if (key === 'require2fa' && cb.checked && !me().twofa) { cb.checked = false; denied(T('gh.need2faYourself')); return; } act('orgSetting', { org: org, key: key, value: cb.checked }); render(); } });
        return el('label', { class: 'gh-check-row' }, [cb, el('span', {}, [el('strong', {}, label), help ? el('div', { class: 'muted small' }, help) : null])]);
      }
      if (sec === 'privileges') {
        var base = el('select', { class: 'input gh-mini', 'aria-label': 'Base permissions', onchange: function () { act('orgSetting', { org: org, key: 'basePermission', value: base.value }); render(); } },
          [['none', 'No permission'], ['read', 'Read'], ['write', 'Write'], ['admin', 'Admin']].map(function (x) { return el('option', { value: x[0], selected: s.basePermission === x[0] ? true : null }, x[1]); }));
        body.append(el('h2', {}, 'Member privileges'),
          el('section', { class: 'gh-set' }, [el('h3', {}, 'Base permissions'), el('p', { class: 'muted small' }, T('gh.baseHelp')), base]),
          el('section', { class: 'gh-set' }, [el('h3', {}, 'Repository creation'), el('p', { class: 'muted small' }, T('gh.createHelp')), check('membersCanCreate', 'Private'), check('membersCanCreatePublic', 'Public')]),
          el('section', { class: 'gh-set' }, [el('h3', {}, 'Repository forking'), check('membersCanFork', 'Allow forking of private repositories')]),
          el('section', { class: 'gh-set' }, [el('h3', {}, 'Admin repository permissions'),
            check('membersCanChangeVisibility', 'Allow members to change repository visibilities for this organization', T('gh.visHelp')),
            check('membersCanDelete', 'Allow members to delete or transfer repositories for this organization', T('gh.delHelp'))]));
      } else if (sec === 'security') {
        var missing = o.owners.concat(o.members).filter(function (l) { return !(w.server.users[l] || {}).twofa; });
        body.append(el('h2', {}, 'Authentication security'), check('require2fa', 'Require two-factor authentication for everyone in the ' + org + ' organization.', T('gh.require2faHelp')),
          missing.length ? el('p', { class: 'gh-flash warn' }, T('gh.no2fa', { list: missing.join(', ') })) : el('p', { class: 'gh-flash ok' }, T('gh.all2fa')));
      } else {
        body.append(el('h2', {}, 'Audit log'), o.audit.length ? el('ul', { class: 'gh-rows gh-box gh-mono small' }, o.audit.map(function (a) { return el('li', { class: 'gh-row' }, [avatar(a.by), el('span', {}, a.by + ' — ' + a.text)]); })) : el('p', { class: 'muted' }, T('gh.noAudit')));
      }
      page.append(el('div', { class: 'gh-settings' }, [nav, body]));
    }
    function visLabel(r) { return r.visibility === 'public' ? 'Public' : r.visibility === 'internal' ? 'Internal' : 'Private'; }
    function confirmDialog(title, body, label, run, needType) {
      var inp = needType ? el('input', { class: 'input', 'aria-label': T('gh.typeToConfirm', { x: needType }) }) : null;
      var d = V.dialog(overlay, title, el('div', {}, [el('p', { html: body }), inp ? el('label', { class: 'field' }, [el('span', { html: T('gh.typeToConfirm', { x: '<b>' + U.escapeHtml(needType) + '</b>' }) }), inp]) : null]),
        [{ label: T('common.cancel') }, { label: label, danger: true, run: function () { if (inp && inp.value.trim() !== needType) { denied(T('gh.typeMismatch')); return false; } run(); } }]);
      return d;
    }

    // ----- repository -----
    function repoPage(slug, tab, rest) {
      var r = w.server.repos[slug], rl = role(slug);
      if (rl === 'none') return notFound();
      if (tab === 'settings' && w.roleRank(rl) < w.roleRank('maintain')) return notFound();   // GitHub answers 404, not "forbidden"
      var openIssues = r.issues.filter(function (i) { return i.state === 'open'; }).length, openPulls = r.pulls.filter(function (p) { return p.state === 'open'; }).length;
      var tabsDef = [['code', '<> Code'], ['issues', '◎ Issues', openIssues], ['pulls', '⇄ Pull requests', openPulls], ['actions', '▷ Actions'], ['projects', '▦ Projects'], ['security', '🛡 Security'], ['insights', '📈 Insights']];
      if (w.roleRank(rl) >= w.roleRank('maintain')) tabsDef.push(['settings', '⚙ Settings']);
      var tabOf = { code: 'code', tree: 'code', blob: 'code', edit: 'code', new: 'code', upload: 'code', commits: 'code', commit: 'code', branches: 'code', releases: 'code', issues: 'issues', pulls: 'pulls', compare: 'pulls', pull: 'pulls', actions: 'actions', settings: 'settings', projects: 'projects', security: 'security', insights: 'insights' }[tab];
      page.append(el('div', { class: 'gh-repo-head' }, [
        el('div', { class: 'gh-repo-title' }, [el('span', { 'aria-hidden': 'true' }, '▣ '), link('/orgs/' + r.owner, r.owner, { class: 'gh-link' }), ' / ', link('/' + slug, el('strong', {}, r.name)), ' ', el('span', { class: 'gh-label' }, visLabel(r)),
          r.archived ? el('span', { class: 'gh-label warn' }, 'Public archive'.replace('Public', visLabel(r))) : null, r.forkOf ? el('div', { class: 'muted small' }, ['forked from ', link('/' + r.forkOf, r.forkOf)]) : null]),
        el('div', { class: 'gh-repo-actions' }, [
          btn(['👁 Watch ', counter(1)], function () { click('watch'); TDC.ui.toast(T('gh.watching')); }, 'gh-sm', { 'data-id': 'watch' }),
          btn(['⑂ Fork ', counter(Object.keys(w.server.repos).filter(function (s) { return w.server.repos[s].forkOf === slug; }).length)], function () { click('fork'); forkDialog(slug); }, 'gh-sm', { 'data-id': 'fork' }),
          btn(['☆ Star ', counter(r.stars)], function () { click('star'); r.stars++; render(); }, 'gh-sm', { 'data-id': 'star' })
        ])
      ]), el('nav', { class: 'gh-tabs gh-repo-tabs' }, tabsDef.map(function (t) {
        return link('/' + slug + (t[0] === 'code' ? '' : '/' + t[0]), [t[1], t[2] ? counter(t[2]) : null], { class: 'gh-tab' + (tabOf === t[0] ? ' on' : ''), onclick: function (e) { e.preventDefault(); click('tab-' + t[0]); go('/' + slug + (t[0] === 'code' ? '' : '/' + t[0])); } });
      })));
      if (r.archived) page.append(el('div', { class: 'gh-flash warn' }, T('gh.archivedBanner')));
      var R = { code: codeTab, tree: codeTab, blob: blobPage, edit: editPage, new: editPage, upload: uploadPage, commits: commitsPage, commit: commitPage, branches: branchesPage, releases: releasesPage,
        issues: issuesPage, pulls: pullsPage, compare: comparePage, pull: pullPage, actions: actionsPage, settings: repoSettings }[tab];
      if (R) R(slug, r, rest, tab); else page.append(el('div', { class: 'gh-box gh-pad muted' }, T('gh.notInSim')));
    }
    function branchSelect(slug, r, cur, onPick) {
      return btn(['⑂ ', el('b', {}, cur), ' ▾'], function (e) {
        click('branch-select');
        var inp = el('input', { class: 'input gui-input', placeholder: T('gh.findBranch'), 'aria-label': T('gh.findBranch') });
        var list = el('div', { class: 'gui-menu' });
        function draw() {
          list.innerHTML = '';
          var q = inp.value.trim();
          Object.keys(r.refs).sort().filter(function (b) { return !q || b.indexOf(q) >= 0; }).forEach(function (b) {
            list.append(el('button', { class: 'gui-menu-item' + (b === cur ? ' on' : ''), onclick: function () { TDC.ui.closePopover(); onPick(b); } }, [b === cur ? '✓ ' : '', b, b === r.defaultBranch ? el('span', { class: 'gh-label' }, 'default') : null]));
          });
          if (q && !r.refs[q] && can(slug, 'push')) list.append(el('button', { class: 'gui-menu-item', onclick: function () { TDC.ui.closePopover(); act('branch', { slug: slug, name: q.replace(/\s+/g, '-'), from: cur }); onPick(q.replace(/\s+/g, '-')); } }, '⑂ ' + T('gh.createBranchFrom', { b: q, from: cur })));
        }
        inp.addEventListener('input', draw); draw();
        TDC.ui.popover(e.currentTarget, el('div', {}, [el('strong', { class: 'small' }, T('gh.switchBranches')), inp, list]));
      }, 'gh-sm', { 'data-id': 'branch-select', 'aria-label': T('gh.branch') + ': ' + cur });
    }
    function cloneMenu(anchor, slug) {
      click('code-button');
      var url = el('input', { class: 'input gh-mono', readonly: true, value: w.urlOf(slug), 'aria-label': 'Clone URL' });
      var kind = 'https';
      var tabs = el('div', { class: 'gh-subtabs' }, [['https', 'HTTPS'], ['ssh', 'SSH'], ['cli', 'GitHub CLI']].map(function (x) {
        return btn(x[1], function () { kind = x[0]; url.value = x[0] === 'ssh' ? w.urlOf(slug, true) : x[0] === 'cli' ? 'gh repo clone ' + slug : w.urlOf(slug); tabs.querySelectorAll('.gh-subtab').forEach(function (b) { b.classList.toggle('on', b.textContent === x[1]); }); click('clone-' + x[0]); }, 'gh-subtab' + (x[0] === 'https' ? ' on' : ''));
      }));
      TDC.ui.popover(anchor, el('div', { class: 'gh-clone' }, [el('strong', {}, '⌨ Clone'), tabs,
        el('div', { class: 'gh-copy-row' }, [url, btn('⧉', function () { url.select(); try { navigator.clipboard.writeText(url.value); } catch (e) {} click('copy-url-' + kind); TDC.ui.toast(T('gh.copied'), 'ok'); }, 'gh-sm', { 'aria-label': T('gh.copyUrl') })]),
        el('p', { class: 'muted small' }, T('gh.cloneHelp')),
        el('button', { class: 'gui-menu-item', onclick: function () { click('open-desktop'); TDC.ui.closePopover(); TDC.ui.toast(T('gh.openDesktop')); } }, '🖥 Open with GitHub Desktop'),
        el('button', { class: 'gui-menu-item', onclick: function () { click('download-zip'); TDC.ui.closePopover(); TDC.ui.toast(T('gh.zipNote')); } }, '⬇ Download ZIP')]));
    }
    function codeTab(slug, r, rest, tab) {
      var branch = (tab === 'tree' && rest[0]) || ui.branch && r.refs[ui.branch] && ui.branchRepo === slug && ui.branch || r.defaultBranch;
      var dir = tab === 'tree' ? rest.slice(1).join('/') : '';
      var sha = r.refs[branch];
      if (!sha) {   // empty repository: quick setup
        page.append(el('div', { class: 'gh-box gh-pad' }, [el('h3', {}, T('gh.quickSetup')), el('div', { class: 'gh-copy-row' }, [el('input', { class: 'input gh-mono', readonly: true, value: w.urlOf(slug), 'aria-label': 'URL' })]),
          el('p', { class: 'small' }, T('gh.emptyRepoHelp')), el('pre', { class: 'gh-codes' }, 'git remote add origin ' + w.urlOf(slug) + '\ngit branch -M main\ngit push -u origin main'),
          can(slug, 'push') ? el('p', {}, [link('/' + slug + '/new/main', T('gh.createNewFile')), ' · ', link('/' + slug + '/upload/main', T('gh.uploadExisting'))]) : null]));
        return;
      }
      var t = w.commit(sha).tree, entries = {};
      Object.keys(t).forEach(function (p) {
        if (dir && p.indexOf(dir + '/') !== 0) return;
        var restP = dir ? p.slice(dir.length + 1) : p, first = restP.split('/')[0];
        entries[first] = restP.indexOf('/') >= 0 ? 'dir' : 'file';
      });
      function lastTouch(path) {
        var cs = w.walk([sha]);
        for (var i = 0; i < cs.length; i++) {
          var c = cs[i], pt = w.commit(c.parents[0]) ? w.commit(c.parents[0]).tree : {};
          var changed = Object.keys(Object.assign({}, pt, c.tree)).some(function (p) { return (p === path || p.indexOf(path + '/') === 0) && pt[p] !== c.tree[p]; });
          if (changed) return c;
        }
        return cs[cs.length - 1];
      }
      var head = w.commit(sha), commits = w.walk([sha]).length;
      var addMenu = btn('Add file ▾', function (e) {
        click('add-file');
        TDC.ui.popover(e.currentTarget, el('div', { class: 'gui-menu' }, [
          el('button', { class: 'gui-menu-item', onclick: function () { TDC.ui.closePopover(); click('create-new-file'); go('/' + slug + '/new/' + branch + (dir ? '/' + dir : '')); } }, '＋ Create new file'),
          el('button', { class: 'gui-menu-item', onclick: function () { TDC.ui.closePopover(); click('upload-files'); go('/' + slug + '/upload/' + branch + (dir ? '/' + dir : '')); } }, '⬆ Upload files')
        ]));
      }, 'gh-sm', { 'data-id': 'add-file' });
      var codeBtn = btn('<> Code ▾', function (e) { cloneMenu(e.currentTarget, slug); }, 'gh-green gh-sm', { 'data-id': 'code-button' });
      var bar = el('div', { class: 'gh-code-bar' }, [branchSelect(slug, r, branch, function (b) { ui.branch = b; ui.branchRepo = slug; go('/' + slug + '/tree/' + b); }),
        link('/' + slug + '/branches', ['⑂ ', el('b', {}, String(Object.keys(r.refs).length)), ' Branches'], { class: 'gh-link small', 'data-id': 'branches-link' }),
        link('/' + slug + '/releases', ['🏷 ', el('b', {}, String(Object.keys(r.tags).length)), ' Tags'], { class: 'gh-link small' }),
        el('span', { class: 'gh-grow' }), el('span', { class: 'gh-search sm', 'aria-hidden': 'true' }, 'Go to file'), addMenu, codeBtn]);
      // "This branch is N commits ahead of …": a fork compares with the original repository, as on GitHub
      var up = r.forkOf && w.server.repos[r.forkOf], baseSlug = up ? r.forkOf : slug, baseRepo = up || r, baseB = baseRepo.defaultBranch;
      var ahead = (up || branch !== r.defaultBranch) && baseRepo.refs[baseB] && !baseRepo.pulls.some(function (p) { return p.state === 'open' && p.head === branch && p.headRepo === slug; })
        ? w.walk([sha]).filter(function (c) { return !w.isAncestor(c.sha, baseRepo.refs[baseB]); }).length : 0;
      var files = el('div', { class: 'gh-box gh-files' }, [
        el('div', { class: 'gh-box-h gh-latest' }, [avatar(head.email.split('@')[0]), el('strong', {}, head.author), el('span', { class: 'gh-ellip' }, head.msg.split('\n')[0]), el('span', { class: 'muted small gh-mono' }, w.short(head.sha) + ' · ' + time(head.time)),
          link('/' + slug + '/commits/' + branch, ['🕘 ', el('b', {}, String(commits)), ' Commits'], { class: 'gh-link small', 'data-id': 'commits-link', onclick: function (e) { e.preventDefault(); click('commits-link'); go('/' + slug + '/commits/' + branch); } })]),
        dir ? el('div', { class: 'gh-row' }, link('/' + slug + '/tree/' + branch + (dir.indexOf('/') > 0 ? '/' + dir.slice(0, dir.lastIndexOf('/')) : ''), '📁 ..')) : null,
        el('ul', { class: 'gh-rows' }, Object.keys(entries).sort(function (a, b) { return (entries[a] === 'dir' ? 0 : 1) - (entries[b] === 'dir' ? 0 : 1) || a.localeCompare(b); }).map(function (n) {
          var full = dir ? dir + '/' + n : n, c = lastTouch(full);
          return el('li', { class: 'gh-row gh-file-row' }, [el('span', { 'aria-hidden': 'true' }, entries[n] === 'dir' ? '📁' : '📄'),
            link('/' + slug + '/' + (entries[n] === 'dir' ? 'tree' : 'blob') + '/' + branch + '/' + full, n, { 'data-id': 'file-' + full, onclick: function (e) { e.preventDefault(); click('file-' + full); go('/' + slug + '/' + (entries[n] === 'dir' ? 'tree' : 'blob') + '/' + branch + '/' + full); } }),
            el('span', { class: 'muted small gh-ellip' }, c.msg.split('\n')[0]), el('span', { class: 'muted small' }, time(c.time))]);
        }))
      ]);
      var readmePath = Object.keys(t).filter(function (p) { return p.toLowerCase() === (dir ? dir + '/' : '') + 'readme.md'; })[0];
      // GitHub's yellow "had recent pushes" banner: branches ahead of the default branch without an open PR.
      var recent = branch === r.defaultBranch ? Object.keys(r.refs).filter(function (b) {
        return b !== r.defaultBranch && !w.isAncestor(r.refs[b], r.refs[r.defaultBranch]) && !r.pulls.some(function (p) { return p.state === 'open' && p.head === b && p.headRepo === slug; });
      }).slice(0, 2) : [];
      var main = el('div', { class: 'gh-main' }, [bar,
        recent.map(function (b) {
          return el('div', { class: 'gh-flash warn' }, ['⑂ ', el('b', {}, b), ' ' + T('gh.recentPushes') + ' ', btn(T('gh.compareAndPr'), function () { click('compare-pr'); ui.compare = { base: r.defaultBranch, head: b, headRepo: slug }; go('/' + slug + '/compare'); }, 'gh-green gh-sm')]);
        }),
        ahead ? el('div', { class: 'gh-flash' }, [T('gh.branchAhead', { n: plural(ahead, 'commit'), b: (up ? baseSlug + ':' : '') + baseB }), ' ',
          btn(up ? T('gh.contribute') : T('gh.compareAndPr'), function () { click('compare-pr'); ui.compare = { base: baseB, head: branch, headRepo: slug }; go('/' + baseSlug + '/compare'); }, 'gh-green gh-sm', { 'data-id': up ? 'contribute' : null })]) : null,
        files, readmePath ? el('div', { class: 'gh-box gh-readme', 'data-id': 'readme' }, [el('div', { class: 'gh-box-h' }, [el('strong', {}, '📖 README')]), md(t[readmePath])]) : null]);
      var lic = Object.keys(t).filter(function (p) { return /^licen[sc]e/i.test(p); })[0];
      var side = el('aside', { class: 'gh-about' }, [el('h3', { class: 'gh-about-h' }, ['About', can(slug, 'settings') ? btn('⚙', function () { aboutDialog(slug, r); }, 'gh-mini-btn', { 'aria-label': 'Edit repository details', 'data-id': 'about-gear' }) : null]), el('p', {}, r.description || el('span', { class: 'muted' }, T('gh.noDescription'))),
        r.topics.length ? el('div', { class: 'gh-topics' }, r.topics.map(function (x) { return el('span', { class: 'gh-topic' }, x); })) : null,
        el('ul', { class: 'gh-about-list' }, [readmePath ? el('li', {}, '📖 Readme') : null, lic ? el('li', {}, '⚖ ' + (t[lic].split('\n')[0] || 'License')) : null,
          el('li', {}, '☆ ' + r.stars + ' stars'), el('li', {}, '🏷 ' + Object.keys(r.tags).length + ' tags'), el('li', {}, T('gh.yourRole') + ': ' + ROLE_LABEL[role(slug)])]),
        el('div', {}, [el('h3', {}, link('/' + slug + '/releases', 'Releases', { 'data-id': 'releases-link' })), r.releases.length ? link('/' + slug + '/releases', '🏷 ' + r.releases[0].name + ' (Latest)')
          : el('p', { class: 'muted small' }, ['No releases published', can(slug, 'push') ? el('br') : null, can(slug, 'push') ? link('/' + slug + '/releases/new', 'Create a new release') : null])])]);
      page.append(el('div', { class: 'gh-code-layout' }, [main, side]));
    }
    function blobPage(slug, r, rest) {
      var branch = rest[0], path = rest.slice(1).join('/'), t = tree(w, slug, branch);
      if (t[path] == null) return notFound();
      var isMd = /\.md$/i.test(path), view = ui.blobView || 'preview';
      var pushOk = can(slug, 'push') || can(slug, 'fork');
      page.append(el('div', { class: 'gh-crumbs' }, [link('/' + slug + '/tree/' + branch, r.name), ' / ' + path]),
        el('div', { class: 'gh-box' }, [el('div', { class: 'gh-box-h' }, [
          isMd ? el('div', { class: 'gh-subtabs' }, [btn('Preview', function () { ui.blobView = 'preview'; render(); }, 'gh-subtab' + (view === 'preview' ? ' on' : '')), btn('Code', function () { ui.blobView = 'code'; render(); }, 'gh-subtab' + (view === 'code' ? ' on' : ''))]) : el('span', {}, t[path].split('\n').length + ' lines'),
          el('span', { class: 'gh-grow' }),
          link('/' + slug + '/commits/' + branch + '/' + path, 'History', { class: 'gh-link small', 'data-id': 'file-history' }),
          pushOk ? btn('✎', function () { click('edit-file'); go('/' + slug + '/edit/' + branch + '/' + path); }, 'gh-sm', { 'aria-label': T('gh.editFile'), title: T('gh.editFile'), 'data-id': 'edit-file' }) : null,
          can(slug, 'push') ? btn('🗑', function () { click('delete-file'); deleteFileDialog(slug, r, branch, path); }, 'gh-sm', { 'aria-label': T('gh.deleteFile'), title: T('gh.deleteFile') }) : null]),
          isMd && view === 'preview' ? md(t[path]) : el('pre', { class: 'gh-blob' }, t[path].split('\n').map(function (l, i) { return el('span', { class: 'gh-line' }, [el('span', { class: 'gh-ln', 'aria-hidden': 'true' }, String(i + 1)), l + '\n']); }))]));
    }
    function deleteFileDialog(slug, r, branch, path) {
      var msg = el('input', { class: 'input', value: 'Delete ' + path, 'aria-label': 'Commit message' });
      V.dialog(overlay, 'Commit changes', el('div', { class: 'gui-form' }, [el('label', { class: 'field' }, [el('span', {}, 'Commit message'), msg])]), [{ label: T('common.cancel') }, { label: 'Commit changes', primary: true, run: function () {
        var ch = {}; ch[path] = null; commitFlow(slug, r, branch, ch, msg.value, null);
      } }]);
    }
    /** Commit from the web UI with GitHub's rules: no write → fork; protected branch → new branch + PR. */
    function commitFlow(slug, r, branch, changes, msg, newBranch, desc, back) {
      msg = (msg || '').trim() || 'Update files';
      if (desc) msg += '\n\n' + desc;
      if (!can(slug, 'push')) {
        var why = w.can(w.me, slug, 'push');
        if (why === 'archived') { denied(T('gh.archivedNoChange')); return; }
        act('fork', { slug: slug });
        var fs = w.me + '/' + r.name, nb = 'patch-' + (Object.keys(w.server.repos[fs].refs).length);
        act('commit', { slug: fs, branch: branch, newBranch: nb, changes: changes, msg: msg });
        ui.compare = { base: branch, head: nb, headRepo: fs };
        go('/' + slug + '/compare');
        TDC.ui.toast(T('gh.forkedForYou', { f: fs }), 'ok', 5000);
        return;
      }
      if (newBranch) {
        act('commit', { slug: slug, branch: branch, newBranch: newBranch, changes: changes, msg: msg });
        ui.compare = { base: branch, head: newBranch, headRepo: slug };
        go('/' + slug + '/compare');
        return;
      }
      act('commit', { slug: slug, branch: branch, changes: changes, msg: msg });
      var first = Object.keys(changes)[0];
      if (back) return go(back);
      go('/' + slug + (changes[first] != null && first ? '/blob/' + branch + '/' + first : ''));
    }
    function protectedFor(slug, branch) { return w.rulesFor(slug, branch, w.me).some(function (x) { return x.requirePR || x.restrictPush; }); }
    function commitBox(slug, r, branch, getChanges, defaultMsg, label, back) {
      // GitHub's "Commit changes" dialog: message, description, direct vs new branch.
      return function () {
        var ch = getChanges(); if (!ch) return;
        var prot = protectedFor(slug, branch), writer = can(slug, 'push');
        var msg = el('input', { class: 'input', value: typeof defaultMsg === 'function' ? defaultMsg() : defaultMsg, 'aria-label': 'Commit message' }), desc = el('textarea', { class: 'input', rows: 2, 'aria-label': 'Extended description', placeholder: 'Add an optional extended description…' });
        var direct = el('input', { type: 'radio', name: 'cm', checked: !prot ? true : null, disabled: prot ? true : null }), nbr = el('input', { type: 'radio', name: 'cm', checked: prot ? true : null });
        var nbName = el('input', { class: 'input gh-mini', value: w.me + '-patch-1', 'aria-label': 'New branch name', hidden: prot ? null : true });
        direct.onchange = nbr.onchange = function () { nbName.hidden = !nbr.checked; };
        V.dialog(overlay, 'Commit changes', el('div', { class: 'gui-form' }, [
          !writer ? el('p', { class: 'gh-flash warn small' }, T('gh.noWriteFork', { f: w.me + '/' + r.name })) : null,
          el('label', { class: 'field' }, [el('span', {}, 'Commit message'), msg]), el('label', { class: 'field' }, [el('span', {}, 'Extended description'), desc]),
          writer ? el('label', { class: 'gui-check' }, [direct, ' ' + T('gh.commitDirect', { b: branch })]) : null,
          writer && prot ? el('p', { class: 'muted small' }, '🔒 ' + T('gh.protectedNote', { b: branch })) : null,
          writer ? el('label', { class: 'gui-check' }, [nbr, ' ' + T('gh.commitNewBranch')]) : null, writer ? nbName : null
        ]), [{ label: T('common.cancel') }, { label: writer ? (label || 'Commit changes') : 'Propose changes', primary: true, run: function () {
          var nb = writer && nbr.checked ? nbName.value.trim().replace(/\s+/g, '-') : null;
          if (nb && r.refs[nb]) { denied(T('gh.branchExists', { b: nb })); return false; }
          commitFlow(slug, r, branch, ch, msg.value, nb, desc.value.trim(), back);
        } }]);
      };
    }
    function editPage(slug, r, rest, tab) {
      var branch = rest[0], isNew = tab === 'new', path = isNew ? '' : rest.slice(1).join('/'), dir = isNew ? rest.slice(1).join('/') : '';
      var t = tree(w, slug, branch);
      if (!isNew && t[path] == null) return notFound();
      if (r.archived) { page.append(el('div', { class: 'gh-flash warn' }, T('gh.archivedNoChange'))); return; }
      var crumbs = (isNew ? dir : path.split('/').slice(0, -1).join('/')).split('/').filter(Boolean), crumbEl = el('span', { class: 'gh-mono' });
      var name = el('input', { class: 'input gh-mono', value: isNew ? '' : path.split('/').pop(), 'aria-label': 'File name', placeholder: 'Name your file…' });
      var drawCrumbs = function () { crumbEl.textContent = crumbs.map(function (c) { return c + ' / '; }).join(''); };
      drawCrumbs();
      name.addEventListener('input', function () { var parts = name.value.split('/'); if (parts.length > 1) { crumbs = crumbs.concat(parts.slice(0, -1).filter(Boolean)); name.value = parts.pop(); drawCrumbs(); } });
      name.addEventListener('keydown', function (e) { if (e.key === 'Backspace' && name.selectionStart === 0 && name.selectionEnd === 0 && crumbs.length) { e.preventDefault(); var c = crumbs.pop(); name.value = c + name.value; name.setSelectionRange(c.length, c.length); drawCrumbs(); } });
      var ta = el('textarea', { class: 'input gh-editor', rows: 14, spellcheck: 'false', 'aria-label': 'File contents' });
      ta.value = isNew ? '' : t[path];
      var preview = el('div', { class: 'gh-md', hidden: true });
      var mode = el('div', { class: 'gh-subtabs' }, [btn('Edit', function () { ta.hidden = false; preview.hidden = true; mode.children[0].classList.add('on'); mode.children[1].classList.remove('on'); }, 'gh-subtab on'),
        btn('Preview', function () { preview.innerHTML = V.md(ta.value); ta.hidden = true; preview.hidden = false; mode.children[1].classList.add('on'); mode.children[0].classList.remove('on'); click('preview'); }, 'gh-subtab')]);
      var writer = can(slug, 'push');
      var getChanges = function () {
        var n = name.value.trim();
        if (!n) { denied(T('gh.needFileName')); return null; }
        n = crumbs.concat(n).join('/');
        var ch = {}, v = ta.value; if (v && !/\n$/.test(v)) v += '\n';
        if (!isNew && n === path && v === t[path]) { denied(T('gh.noChanges')); return null; }
        if (!isNew && n !== path) ch[path] = null;
        if (isNew && t[n] != null) { denied(T('gh.fileExists', { f: n })); return null; }
        ch[n] = v; return ch;
      };
      page.append(!writer ? el('div', { class: 'gh-flash warn' }, T('gh.noWriteFork', { f: w.me + '/' + r.name })) : null,
        el('div', { class: 'gh-edit-head' }, [link('/' + slug, r.name), ' / ', crumbEl, name, el('span', { class: 'muted small' }, ' in ' + branch), el('span', { class: 'gh-grow' }),
          btn('Cancel changes', function () { go('/' + slug); }, 'gh-sm'),
          btn(writer ? 'Commit changes…' : 'Propose changes', commitBox(slug, r, branch, getChanges, function () { return (isNew ? 'Create ' : 'Update ') + (name.value.trim() || 'new file'); }), 'gh-green gh-sm', { 'data-id': 'commit-changes' })]),
        el('div', { class: 'gh-box' }, [el('div', { class: 'gh-box-h' }, [mode]), ta, preview]));
    }
    function uploadPage(slug, r, rest) {
      var branch = rest[0], dir = rest.slice(1).join('/');
      if (r.archived) { page.append(el('div', { class: 'gh-flash warn' }, T('gh.archivedNoChange'))); return; }
      var chosen = ui.uploadChosen = ui.uploadChosen || [];
      var avail = cfg.uploads || { 'report.pdf': '%PDF-1.7 (pretend PDF)\n', 'minutes-2026-11-04.docx': '(pretend Word document)\n', 'photo.jpg': '(pretend image)\n' };
      function pick() {
        click('choose-files');
        var boxes = Object.keys(avail).map(function (f) { return [f, el('input', { type: 'checkbox', checked: chosen.indexOf(f) >= 0 ? true : null })]; });
        V.dialog(overlay, T('gh.filePicker'), el('div', { class: 'gui-form' }, [el('p', { class: 'muted small' }, T('gh.filePickerHint'))].concat(boxes.map(function (b) { return el('label', { class: 'gui-check' }, [b[1], ' 📄 ' + b[0]]); }))),
          [{ label: T('common.cancel') }, { label: 'Open', primary: true, run: function () { ui.uploadChosen = boxes.filter(function (b) { return b[1].checked; }).map(function (b) { return b[0]; }); render(); } }]);
      }
      var getChanges = function () {
        if (!ui.uploadChosen.length) { denied(T('gh.noFilesChosen')); return null; }
        var ch = {}; ui.uploadChosen.forEach(function (f) { ch[(dir ? dir + '/' : '') + f] = avail[f]; }); return ch;
      };
      var drop = el('div', { class: 'gh-drop', tabindex: '0', role: 'button', 'aria-label': T('gh.chooseFiles'), onclick: pick, onkeydown: function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } } },
        [el('div', { class: 'gh-drop-icon', 'aria-hidden': 'true' }, '📄'), el('strong', {}, 'Drag files here to add them to your repository'), el('span', {}, ['Or ', el('u', {}, 'choose your files')])]);
      page.append(el('div', { class: 'gh-crumbs' }, [link('/' + slug, r.name), ' / ' + (dir || '')]), drop,
        chosen.length ? el('ul', { class: 'gh-rows gh-box' }, chosen.map(function (f) { return el('li', { class: 'gh-row' }, ['📄 ' + f, btn('✕', function () { ui.uploadChosen = chosen.filter(function (x) { return x !== f; }); render(); }, 'gh-mini-btn', { 'aria-label': T('gh.remove') + ' ' + f })]); })) : null,
        btn('Commit changes…', function () { var f = commitBox(slug, r, branch, getChanges, 'Add files via upload', null, '/' + slug + (dir ? '/tree/' + branch + '/' + dir : '')); var ok = getChanges(); if (ok) { f(); } }, 'gh-green', { 'data-id': 'upload-commit' }));
      // after a successful commit, forget the chosen files
      if (w.events.length && w.events[w.events.length - 1].type === 'commit') ui.uploadChosen = [];
    }
    function commitsPage(slug, r, rest) {
      var branch = rest[0] || r.defaultBranch, sha = r.refs[branch], path = rest.slice(1).join('/');
      if (!sha) return notFound();
      // /commits/<branch>/<path> = the file's History: only commits that changed it (vs first parent)
      var list = w.walk([sha]).filter(function (c) { if (!path) return true; var p = w.commit(c.parents[0]); return (p ? p.tree[path] : undefined) !== c.tree[path]; });
      page.append(el('div', { class: 'gh-code-bar' }, [branchSelect(slug, r, branch, function (b) { go('/' + slug + '/commits/' + b + (path ? '/' + path : '')); }), el('h3', {}, path ? ['History for ', el('code', {}, path)] : 'Commits')]),
        el('ul', { class: 'gh-rows gh-box' }, list.map(function (c) {
          return el('li', { class: 'gh-row' }, [el('div', { class: 'gh-grow' }, [link('/' + slug + '/commit/' + c.sha, c.msg.split('\n')[0], { class: 'gh-link gh-strong', onclick: function (e) { e.preventDefault(); click('commit-' + w.short(c.sha)); go('/' + slug + '/commit/' + c.sha); } }),
            el('div', { class: 'muted small' }, [avatar(c.email.split('@')[0]), ' ', c.author + ' committed on ' + time(c.time)])]), el('code', {}, w.short(c.sha))]);
        })));
    }
    function commitPage(slug, r, rest) {
      var c = w.commit(rest[0]); if (!c) return notFound();
      var pt = w.commit(c.parents[0]) ? w.commit(c.parents[0]).tree : {};
      page.append(el('div', { class: 'gh-box gh-pad' }, [el('h3', {}, c.msg.split('\n')[0]), c.msg.indexOf('\n') > 0 ? el('pre', { class: 'gh-commit-body' }, c.msg.split('\n').slice(1).join('\n').trim()) : null,
        el('p', { class: 'muted small' }, [avatar(c.email.split('@')[0]), ' ' + c.author + ' committed on ' + time(c.time) + ' · ', el('code', {}, c.sha)]),
        c.parents.length ? el('p', { class: 'muted small' }, c.parents.length + ' parent' + (c.parents.length > 1 ? 's ' : ' ') + c.parents.map(w.short).join(' + ')) : null]));
      Object.keys(Object.assign({}, pt, c.tree)).sort().forEach(function (p) {
        if (pt[p] !== c.tree[p]) page.append(el('div', { class: 'gh-box' }, [el('div', { class: 'gh-box-h gh-mono small' }, p), el('div', { class: 'diff', html: V.diffHtml(pt[p], c.tree[p]) })]));
      });
    }
    function branchesPage(slug, r) {
      var name = el('input', { class: 'input gh-mini', placeholder: 'new-branch', 'aria-label': T('gh.newBranchName') });
      page.append(el('div', { class: 'gh-box' }, [el('div', { class: 'gh-box-h' }, [el('strong', {}, 'Branches'), can(slug, 'push') ? el('span', { class: 'gh-copy-row' }, [name, btn('New branch', function () {
        var n = name.value.trim().replace(/\s+/g, '-'); if (!n) return; if (r.refs[n]) { denied(T('gh.branchExists', { b: n })); return; }
        act('branch', { slug: slug, name: n }); render();
      }, 'gh-green gh-sm')]) : null]),
        el('ul', { class: 'gh-rows' }, Object.keys(r.refs).sort().map(function (b) {
          var c = w.commit(r.refs[b]), prot = w.rulesFor(slug, b, '~nobody').length > 0;
          return el('li', { class: 'gh-row' }, [link('/' + slug + '/tree/' + b, b, { class: 'gh-link gh-mono' }), b === r.defaultBranch ? el('span', { class: 'gh-label' }, 'Default') : null, prot ? el('span', { class: 'gh-label', title: T('gh.rulesApply') }, '🔒') : null,
            el('span', { class: 'muted small gh-ellip' }, c.msg.split('\n')[0]),
            can(slug, 'push') && b !== r.defaultBranch ? btn('🗑', function () {
              if (w.rulesFor(slug, b, w.me).some(function (x) { return x.blockDelete; })) { denied(T('gh.cannotDeleteProtected')); return; }
              act('branchDelete', { slug: slug, name: b }); render();
            }, 'gh-mini-btn', { 'aria-label': T('gh.deleteBranch', { b: b }) }) : null]);
        }))]));
    }
    function releasesPage(slug, r, rest) {
      if (rest[0] === 'new') {
        if (!can(slug, 'push')) return notFound();
        var tag = el('input', { class: 'input gh-mini', placeholder: 'v1.0', 'aria-label': 'Tag' }), title = el('input', { class: 'input', 'aria-label': 'Release title' });
        var notes = el('textarea', { class: 'input', rows: 5, 'aria-label': 'Release notes', placeholder: 'Describe this release' });
        var avail = Object.keys(cfg.uploads || { 'thesis.pdf': '' }), boxes = avail.map(function (f) { return [f, el('input', { type: 'checkbox' })]; });
        page.append(el('div', { class: 'gh-narrow' }, [el('h2', {}, 'New release'), el('label', { class: 'field' }, [el('span', {}, 'Choose a tag (type a new one to create it)'), tag]),
          el('p', { class: 'muted small' }, 'Target: ' + r.defaultBranch), el('label', { class: 'field' }, [el('span', {}, 'Release title'), title]), el('label', { class: 'field' }, [el('span', {}, 'Describe this release'), notes]),
          el('fieldset', { class: 'gh-fs' }, [el('legend', {}, 'Attach binaries')].concat(boxes.map(function (b) { return el('label', { class: 'gui-check' }, [b[1], ' 📎 ' + b[0]]); }))),
          btn('Publish release', function () {
            var tg = tag.value.trim(); if (!/^[\w.\-\/]+$/.test(tg)) { denied(T('gh.needTag')); return; }
            if (r.releases.some(function (x) { return x.tag === tg; })) { denied(T('gh.releaseExists', { t: tg })); return; }
            act('release', { slug: slug, tag: tg, name: title.value.trim() || tg, notes: notes.value, files: boxes.filter(function (b) { return b[1].checked; }).map(function (b) { return b[0]; }) });
            go('/' + slug + '/releases');
          }, 'gh-green')]));
        return;
      }
      page.append(el('div', { class: 'gh-box-h' }, [el('h3', {}, 'Releases'), can(slug, 'push') ? btn('Draft a new release', function () { click('draft-release'); go('/' + slug + '/releases/new'); }, 'gh-sm') : null]));
      page.append(r.releases.length ? el('div', {}, r.releases.map(function (rel, i) {
        return el('div', { class: 'gh-box gh-pad' }, [el('h3', {}, [rel.name, i === 0 ? el('span', { class: 'gh-label ok' }, 'Latest') : null]), el('p', { class: 'muted small' }, '🏷 ' + rel.tag + ' · ' + rel.by), md(rel.notes),
          rel.files.length ? el('ul', { class: 'gh-rows' }, rel.files.map(function (f) { return el('li', {}, '📎 ' + f); })) : null]);
      })) : el('p', { class: 'muted' }, Object.keys(r.tags).length ? 'Tags: ' + Object.keys(r.tags).join(', ') : T('gh.noReleases')));
    }

    // ----- issues -----
    function issuesPage(slug, r, rest) {
      if (rest[0] === 'new') return newIssue(slug, r);
      if (rest[0]) return issueView(slug, r, +rest[0]);
      var st = ui.issueState || 'open', list = r.issues.filter(function (i) { return i.state === st; });
      page.append(el('div', { class: 'gh-box' }, [el('div', { class: 'gh-box-h' }, [
        btn('◎ ' + r.issues.filter(function (i) { return i.state === 'open'; }).length + ' Open', function () { ui.issueState = 'open'; render(); }, 'gh-subtab' + (st === 'open' ? ' on' : '')),
        btn('✓ ' + r.issues.filter(function (i) { return i.state === 'closed'; }).length + ' Closed', function () { ui.issueState = 'closed'; render(); }, 'gh-subtab' + (st === 'closed' ? ' on' : '')),
        el('span', { class: 'gh-grow' }), can(slug, 'issue') ? btn('New issue', function () { click('new-issue'); go('/' + slug + '/issues/new'); }, 'gh-green gh-sm', { 'data-id': 'new-issue' }) : null]),
        list.length ? el('ul', { class: 'gh-rows' }, list.map(function (i) {
          return el('li', { class: 'gh-row' }, [el('span', { class: i.state === 'open' ? 'gh-open' : 'gh-done', 'aria-hidden': 'true' }, i.state === 'open' ? '◎' : '✓'),
            el('div', { class: 'gh-grow' }, [link('/' + slug + '/issues/' + i.num, i.title, { class: 'gh-link gh-strong' }), ' ', i.labels.map(function (l) { return el('span', { class: 'gh-labelchip' }, l); }),
              el('div', { class: 'muted small' }, '#' + i.num + ' opened by ' + i.author + (i.milestone ? ' · 🏁 ' + i.milestone : ''))]),
            i.assignees.length ? el('span', {}, i.assignees.map(function (a) { return avatar(a); })) : null, i.comments.length ? el('span', { class: 'muted small' }, '💬 ' + i.comments.length) : null]);
        })) : el('p', { class: 'muted gh-pad' }, T('gh.noIssues'))]));
    }
    function pickerBox(title, all, cur, onSet, enabled) {
      return el('div', { class: 'gh-side-sec' }, [el('div', { class: 'gh-side-h' }, [el('strong', {}, title), enabled ? btn('⚙', function (e) {
        var boxes = all.map(function (x) { return [x, el('input', { type: 'checkbox', checked: cur.indexOf(x) >= 0 ? true : null })]; });
        TDC.ui.popover(e.currentTarget, el('div', { class: 'gui-menu' }, boxes.map(function (b) { return el('label', { class: 'gui-check gh-pick' }, [b[1], ' ' + b[0]]); }).concat([
          btn(T('gh.apply'), function () { TDC.ui.closePopover(); onSet(boxes.filter(function (b) { return b[1].checked; }).map(function (b) { return b[0]; })); }, 'gh-green gh-sm')])));
      }, 'gh-mini-btn', { 'aria-label': T('gh.edit') + ' ' + title }) : null]), el('div', { class: 'small' }, cur.length ? cur.join(', ') : el('span', { class: 'muted' }, 'None yet'))]);
    }
    function people(slug) {
      var o = w.server.orgs[slug.split('/')[0]], all = Object.keys(w.server.users).filter(function (u) { return w.roleRank(w.roleOf(u, slug)) >= w.roleRank('read') && (!o || o.owners.concat(o.members, o.outside).indexOf(u) >= 0 || w.server.repos[slug].collaborators[u]); });
      return all;
    }
    function newIssue(slug, r) {
      var st = ui.newIssue = ui.newIssue || { labels: [], assignees: [], milestone: null, title: '', body: '' };
      // the pickers re-render the page, so the typed text lives in the draft too
      var title = el('input', { class: 'input', 'aria-label': 'Title', placeholder: 'Title', value: st.title, oninput: function () { st.title = title.value; } }),
        body = el('textarea', { class: 'input', rows: 6, 'aria-label': 'Description', placeholder: 'Type your description here…', oninput: function () { st.body = body.value; } });
      body.value = st.body;
      var tri = can(slug, 'triage');
      page.append(el('div', { class: 'gh-two-side' }, [el('div', { class: 'gh-box gh-pad' }, [el('h3', {}, 'Create new issue'), el('label', { class: 'field' }, [el('span', {}, 'Add a title *'), title]), el('label', { class: 'field' }, [el('span', {}, 'Add a description'), body]),
        btn('Create', function () {
          if (!title.value.trim()) { denied(T('gh.needTitle')); return; }
          act('issue', { slug: slug, title: title.value.trim(), body: body.value, labels: st.labels, assignees: st.assignees, milestone: st.milestone }); ui.newIssue = null;
          go('/' + slug + '/issues/' + (r.nextNum - 1));
        }, 'gh-green')]),
        el('aside', { class: 'gh-issue-side' }, [pickerBox('Assignees', people(slug), st.assignees, function (v) { st.assignees = v; render(); }, tri), pickerBox('Labels', r.labels, st.labels, function (v) { st.labels = v; render(); }, tri),
          pickerBox('Milestone', r.milestones, st.milestone ? [st.milestone] : [], function (v) { st.milestone = v[v.length - 1] || null; render(); }, tri),
          !tri ? el('p', { class: 'muted small' }, T('gh.triageNeeded')) : null])]));
    }
    function issueView(slug, r, num) {
      var is = r.issues.filter(function (i) { return i.num === num; })[0]; if (!is) return notFound();
      var tri = can(slug, 'triage'), canClose = tri || is.author === w.me;
      var box = el('textarea', { class: 'input', rows: 3, 'aria-label': 'Comment', placeholder: 'Use Markdown to format your comment' });
      function upd(x) { act('issueUpdate', Object.assign({ slug: slug, num: num }, x)); render(); }
      page.append(el('h2', { class: 'gh-issue-title' }, [is.title, el('span', { class: 'muted' }, ' #' + num)]),
        el('p', {}, [el('span', { class: 'gh-state ' + (is.state === 'open' ? 'open' : 'closed') }, is.state === 'open' ? '◎ Open' : '✓ Closed'), ' ' + is.author + ' opened this issue']),
        el('div', { class: 'gh-two-side' }, [el('div', {}, [
          el('div', { class: 'gh-comment' }, [el('div', { class: 'gh-comment-h' }, [avatar(is.author), ' ', el('strong', {}, is.author)]), md(is.body || '_No description provided._')]),
          el('div', {}, is.comments.map(function (c) { return el('div', { class: 'gh-comment' }, [el('div', { class: 'gh-comment-h' }, [avatar(c.by), ' ', el('strong', {}, c.by)]), md(c.body)]); })),
          can(slug, 'comment') ? el('div', { class: 'gh-comment gh-pad' }, [box, el('div', { class: 'btn-row' }, [
            canClose ? btn(is.state === 'open' ? '✓ Close issue' : 'Reopen issue', function () { upd({ comment: box.value.trim() || undefined, state: is.state === 'open' ? 'closed' : 'open' }); }, 'gh-sm', { 'data-id': 'close-issue' }) : null,
            btn('Comment', function () { if (!box.value.trim()) return; upd({ comment: box.value.trim() }); }, 'gh-green gh-sm')])]) : null]),
          el('aside', { class: 'gh-issue-side' }, [pickerBox('Assignees', people(slug), is.assignees, function (v) { upd({ assignees: v }); }, tri), pickerBox('Labels', r.labels, is.labels, function (v) { upd({ labels: v }); }, tri),
            pickerBox('Milestone', r.milestones, is.milestone ? [is.milestone] : [], function (v) { upd({ milestone: v[v.length - 1] || null }); }, tri)])]));
    }

    // ----- pull requests -----
    function pullsPage(slug, r) {
      var st = ui.prState || 'open', list = r.pulls.filter(function (p) { return st === 'open' ? p.state === 'open' : p.state !== 'open'; });
      page.append(el('div', { class: 'gh-box' }, [el('div', { class: 'gh-box-h' }, [
        btn('⇄ ' + r.pulls.filter(function (p) { return p.state === 'open'; }).length + ' Open', function () { ui.prState = 'open'; render(); }, 'gh-subtab' + (st === 'open' ? ' on' : '')),
        btn('✓ ' + r.pulls.filter(function (p) { return p.state !== 'open'; }).length + ' Closed', function () { ui.prState = 'closed'; render(); }, 'gh-subtab' + (st !== 'open' ? ' on' : '')),
        el('span', { class: 'gh-grow' }), btn('New pull request', function () { click('new-pr'); ui.compare = null; go('/' + slug + '/compare'); }, 'gh-green gh-sm', { 'data-id': 'new-pr' })]),
        list.length ? el('ul', { class: 'gh-rows' }, list.map(function (p) {
          return el('li', { class: 'gh-row' }, [el('span', { class: p.state === 'open' ? 'gh-open' : p.state === 'merged' ? 'gh-merged' : 'gh-done', 'aria-hidden': 'true' }, p.state === 'merged' ? '⇲' : '⇄'),
            el('div', { class: 'gh-grow' }, [link('/' + slug + '/pull/' + p.num, p.title, { class: 'gh-link gh-strong' }), el('div', { class: 'muted small' }, '#' + p.num + ' ' + (p.state === 'merged' ? 'merged' : p.state === 'open' ? 'opened' : 'closed') + ' · ' + p.author + ' · ' + (p.headRepo !== slug ? p.headRepo.split('/')[0] + ':' : '') + p.head + ' → ' + p.base)])]);
        })) : el('p', { class: 'muted gh-pad' }, T('gh.noPulls'))]));
    }
    function comparePage(slug, r) {
      var c = ui.compare || { base: r.defaultBranch, head: Object.keys(r.refs).filter(function (b) { return b !== r.defaultBranch; })[0] || r.defaultBranch, headRepo: slug };
      ui.compare = c;
      var forks = Object.keys(w.server.repos).filter(function (s) { return w.server.repos[s].forkOf === slug && role(s) !== 'none'; });
      var heads = [slug].concat(forks);
      var baseSel = el('select', { class: 'input gh-mini', 'aria-label': 'base', onchange: function () { c.base = baseSel.value; render(); } }, Object.keys(r.refs).map(function (b) { return el('option', { value: b, selected: b === c.base ? true : null }, 'base: ' + b); }));
      var headOpts = [];
      heads.forEach(function (s) { Object.keys(w.server.repos[s].refs).forEach(function (b) { headOpts.push([s, b]); }); });
      var headSel = el('select', { class: 'input gh-mini', 'aria-label': 'compare', onchange: function () { var x = headSel.value.split('|'); c.headRepo = x[0]; c.head = x[1]; render(); } },
        headOpts.map(function (x) { return el('option', { value: x[0] + '|' + x[1], selected: x[0] === c.headRepo && x[1] === c.head ? true : null }, 'compare: ' + (x[0] !== slug ? x[0].split('/')[0] + ':' : '') + x[1]); }));
      var hs = w.server.repos[c.headRepo] && w.server.repos[c.headRepo].refs[c.head], bs = r.refs[c.base];
      page.append(el('h3', {}, 'Comparing changes'), el('p', { class: 'muted small' }, T('gh.compareHelp')), el('div', { class: 'gh-code-bar' }, [baseSel, '←', headSel]));
      if (!hs || !bs || hs === bs || w.isAncestor(hs, bs)) { page.append(el('div', { class: 'gh-box gh-pad' }, T('gh.nothingToCompare'))); return; }
      var mb = w.mergeBase(bs, hs), m = w.mergeTrees(w.commit(mb) ? w.commit(mb).tree : {}, w.commit(bs).tree, w.commit(hs).tree, c.base, c.head);
      var newCommits = w.walk([hs]).filter(function (x) { return !w.isAncestor(x.sha, bs); });
      var existing = r.pulls.filter(function (p) { return p.state === 'open' && p.head === c.head && p.headRepo === c.headRepo; })[0];
      page.append(el('p', { class: m.conflicts.length ? 'bad' : 'ok' }, m.conflicts.length ? '✗ Can’t automatically merge. ' + T('gh.canStillOpen') : '✓ Able to merge. These branches can be automatically merged.'));
      if (existing) page.append(el('div', { class: 'gh-flash' }, [T('gh.prExists'), ' ', link('/' + slug + '/pull/' + existing.num, '#' + existing.num + ' ' + existing.title)]));
      else {
        var title = el('input', { class: 'input', value: newCommits.length === 1 ? newCommits[0].msg.split('\n')[0] : c.head.replace(/[-_]/g, ' '), 'aria-label': 'Title' });
        var body = el('textarea', { class: 'input', rows: 5, 'aria-label': 'Description', placeholder: 'Add a description' });
        page.append(el('div', { class: 'gh-box gh-pad' }, [el('h3', {}, 'Open a pull request'), el('label', { class: 'field' }, [el('span', {}, 'Add a title'), title]), el('label', { class: 'field' }, [el('span', {}, 'Add a description'), body]),
          btn('Create pull request', function () {
            if (!title.value.trim()) { denied(T('gh.needTitle')); return; }
            act('pr', { slug: slug, base: c.base, head: c.head, headRepo: c.headRepo, title: title.value.trim(), body: body.value });
            ui.compare = null; go('/' + slug + '/pull/' + r.pulls[r.pulls.length - 1].num);
          }, 'gh-green', { 'data-id': 'create-pr' })]));
      }
      page.append(el('p', { class: 'muted small' }, plural(newCommits.length, 'commit') + ': ' + newCommits.map(function (x) { return x.msg.split('\n')[0]; }).join(' · ')));
      Object.keys(Object.assign({}, w.commit(mb).tree, w.commit(hs).tree)).sort().forEach(function (p) {
        var a = w.commit(mb).tree[p], b = w.commit(hs).tree[p];
        if (a !== b) page.append(el('div', { class: 'gh-box' }, [el('div', { class: 'gh-box-h gh-mono small' }, p), el('div', { class: 'diff', html: V.diffHtml(a, b) })]));
      });
    }
    function pullPage(slug, r, rest) {
      var p = r.pulls.filter(function (x) { return x.num === +rest[0]; })[0]; if (!p) return notFound();
      var files = rest[1] === 'files';
      var hs = w.server.repos[p.headRepo] ? w.server.repos[p.headRepo].refs[p.head] : null, bs = r.refs[p.base];
      page.append(el('h2', { class: 'gh-issue-title' }, [p.title, el('span', { class: 'muted' }, ' #' + p.num)]),
        el('p', {}, [el('span', { class: 'gh-state ' + (p.state === 'open' ? 'open' : p.state === 'merged' ? 'merged' : 'closed') }, p.state === 'open' ? '⇄ Open' : p.state === 'merged' ? '⇲ Merged' : '✕ Closed'),
          ' ' + p.author + (p.state === 'merged' ? ' — merged by ' + p.mergedBy : ' wants to merge into ') + ' ', el('code', {}, p.base), ' from ', el('code', {}, (p.headRepo !== slug ? p.headRepo.split('/')[0] + ':' : '') + p.head)]),
        el('nav', { class: 'gh-tabs' }, [link('/' + slug + '/pull/' + p.num, '💬 Conversation', { class: 'gh-tab' + (!files ? ' on' : '') }), link('/' + slug + '/pull/' + p.num + '/files', '± Files changed', { class: 'gh-tab' + (files ? ' on' : ''), 'data-id': 'files-changed', onclick: function (e) { e.preventDefault(); click('files-changed'); go('/' + slug + '/pull/' + p.num + '/files'); } })]));
      if (files) {
        var mb = hs && bs ? w.mergeBase(bs, hs) : null, A0 = mb ? w.commit(mb).tree : {}, B0 = hs ? w.commit(hs).tree : {};
        var reviewer = w.me !== p.author && can(slug, 'comment');
        page.append(el('div', { class: 'gh-box-h' }, [el('span', { class: 'gh-grow' }), p.state === 'open' && can(slug, 'comment') ? btn('Review changes ▾', function (e) { click('review-changes'); reviewPopover(e.currentTarget, slug, p); }, 'gh-green gh-sm', { 'data-id': 'review-changes' }) : null]));
        Object.keys(Object.assign({}, A0, B0)).sort().forEach(function (f) { if (A0[f] !== B0[f]) page.append(el('div', { class: 'gh-box' }, [el('div', { class: 'gh-box-h gh-mono small' }, f), el('div', { class: 'diff', html: V.diffHtml(A0[f], B0[f]) })])); });
        if (!reviewer) page.append(el('p', { class: 'muted small' }, T('gh.ownPrReview')));
        return;
      }
      var timeline = el('div', {}, [el('div', { class: 'gh-comment' }, [el('div', { class: 'gh-comment-h' }, [avatar(p.author), ' ', el('strong', {}, p.author)]), md(p.body || '_No description provided._')])]);
      p.comments.forEach(function (c) { timeline.append(el('div', { class: 'gh-comment' }, [el('div', { class: 'gh-comment-h' }, [avatar(c.by), ' ', el('strong', {}, c.by)]), md(c.body)])); });
      p.reviews.forEach(function (rv) {
        timeline.append(el('div', { class: 'gh-review ' + rv.state }, [avatar(rv.user), ' ', el('strong', {}, rv.user), ' ', rv.state === 'approved' ? '✓ approved these changes' : rv.state === 'changes' ? '✗ requested changes' : '💬 reviewed', rv.body ? md(rv.body) : null]));
      });
      var mergeBox = el('div', { class: 'gh-merge' });
      if (p.state === 'open') {
        var probs = w.pullChecks(slug, p, w.me), ci = r.ci ? w.ciResult(slug, hs) : null;
        if (ci) mergeBox.append(el('div', { class: 'gh-check ' + (ci.ok ? 'ok' : 'bad') }, [ci.ok ? '✓ ' : '✗ ', el('strong', {}, r.ci.name), ci.ok ? ' — Successful' : ' — Failing', ' ', link('/' + slug + '/actions/runs/' + hs, 'Details')]));
        probs.forEach(function (x) { mergeBox.append(el('div', { class: 'gh-check bad' }, '✗ ' + x)); });
        var canMerge = can(slug, 'merge');
        if (!probs.length) mergeBox.append(el('div', { class: 'gh-check ok' }, '✓ ' + T('gh.noConflicts')));
        if (!canMerge) mergeBox.append(el('p', { class: 'muted small' }, T('gh.onlyWriteMerge')));
        else {
          var method = ui.mergeMethod || 'merge';
          var labels = { merge: 'Merge pull request', squash: 'Squash and merge', rebase: 'Rebase and merge' };
          mergeBox.append(el('div', { class: 'gh-merge-btns' }, [
            btn(labels[method], function () {
              if (probs.length) return;
              click('merge-button');
              V.dialog(overlay, labels[method], el('p', {}, T('gh.mergeConfirm', { b: p.base })), [{ label: T('common.cancel') }, { label: { merge: 'Confirm merge', squash: 'Confirm squash and merge', rebase: 'Confirm rebase and merge' }[method], primary: true, run: function () {
                var res = act('merge', { slug: slug, num: p.num, method: method }); if (res !== true) denied(String(res)); render();
              } }]);
            }, 'gh-green', { disabled: probs.length ? true : null, 'data-id': 'merge-button' }),
            btn('▾', function (e) {
              TDC.ui.popover(e.currentTarget, el('div', { class: 'gui-menu' }, Object.keys(labels).map(function (k) { return el('button', { class: 'gui-menu-item' + (k === method ? ' on' : ''), onclick: function () { TDC.ui.closePopover(); ui.mergeMethod = k; render(); } }, k === 'merge' ? 'Create a merge commit' : labels[k]); })));
            }, 'gh-green', { 'aria-label': T('gh.mergeMethod'), disabled: probs.length ? true : null })]));
          if (probs.length && w.rulesFor(slug, p.base, '~nobody').length && !w.rulesFor(slug, p.base, w.me).length) mergeBox.append(el('p', { class: 'muted small' }, T('gh.bypassNote')));
        }
      } else if (p.state === 'merged') {
        mergeBox.append(el('div', { class: 'gh-check merged' }, '⇲ Pull request successfully merged and closed'));
        if (p.headRepo === slug && can(slug, 'push')) {
          if (r.refs[p.head]) mergeBox.append(btn('Delete branch', function () { act('branchDelete', { slug: slug, name: p.head, pr: p.num }); render(); }, 'gh-sm', { 'data-id': 'delete-branch' }));
          else if (p.deletedHead) mergeBox.append(el('p', { class: 'small' }, [T('gh.branchDeleted', { b: p.head }), ' ', btn('Restore branch', function () { act('branch', { slug: slug, name: p.head, sha: p.deletedHead }); render(); }, 'gh-sm', { 'data-id': 'restore-branch' })]));
        }
      }
      var cbox = el('textarea', { class: 'input', rows: 3, 'aria-label': 'Comment', placeholder: 'Add a comment' });
      page.append(el('div', { class: 'gh-two-side' }, [el('div', {}, [timeline, mergeBox, p.state === 'open' && can(slug, 'comment') ? el('div', { class: 'gh-comment gh-pad' }, [cbox, el('div', { class: 'btn-row' }, [
        (w.me === p.author || can(slug, 'push')) ? btn('Close pull request', function () { act('prClose', { slug: slug, num: p.num }); render(); }, 'gh-sm') : null,
        btn('Comment', function () { if (cbox.value.trim()) { act('prComment', { slug: slug, num: p.num, body: cbox.value.trim() }); render(); } }, 'gh-green gh-sm')])]) : null]),
        el('aside', { class: 'gh-issue-side' }, [pickerBox('Reviewers', people(slug).filter(function (u) { return u !== p.author; }), (p.reviewers || []).concat(p.reviews.map(function (rv) { return rv.user; })).filter(function (u, i, a) { return a.indexOf(u) === i; }), function (v) { v.forEach(function (l) { act('requestReview', { slug: slug, num: p.num, login: l }); }); render(); }, p.state === 'open' && (w.me === p.author || can(slug, 'triage')))])]));
    }
    function reviewPopover(anchor, slug, p) {
      var body = el('textarea', { class: 'input', rows: 3, 'aria-label': 'Review comment', placeholder: 'Leave a comment' });
      var own = w.me === p.author, writer = can(slug, 'push');
      var opts = [['comment', 'Comment', 'Submit general feedback without explicit approval.'], ['approved', 'Approve', 'Give your approval to merge these changes.'], ['changes', 'Request changes', 'Submit feedback that must be addressed before merging.']];
      var radios = opts.map(function (o, i) { return el('input', { type: 'radio', name: 'rv', value: o[0], checked: i === 0 ? true : null, disabled: own && i > 0 ? true : null }); });
      TDC.ui.popover(anchor, el('div', { class: 'gh-review-pop' }, [el('strong', {}, 'Finish your review'), body].concat(opts.map(function (o, i) {
        return el('label', { class: 'gh-radio' }, [radios[i], el('span', {}, [el('b', {}, o[1]), el('div', { class: 'muted small' }, o[2])])]);
      }), [own ? el('p', { class: 'muted small' }, T('gh.ownPrReview')) : null, !writer && !own ? el('p', { class: 'muted small' }, T('gh.reviewNoWrite')) : null,
        btn('Submit review', function () {
          var v = radios.filter(function (x) { return x.checked; })[0].value;
          if (v !== 'approved' && v !== 'changes' && !body.value.trim()) { denied(T('gh.reviewNeedsText')); return; }
          TDC.ui.closePopover(); act('review', { slug: slug, num: p.num, state: v, body: body.value.trim() }); go('/' + slug + '/pull/' + p.num);
        }, 'gh-green gh-sm')])));
    }

    // ----- actions -----
    function actionsPage(slug, r, rest) {
      if (!r.ci) { page.append(el('div', { class: 'gh-box gh-pad' }, [el('h3', {}, 'Get started with GitHub Actions'), el('p', { class: 'muted' }, T('gh.noWorkflows'))])); return; }
      if (rest[0] === 'runs') {
        var c = w.commit(rest[1]); if (!c) return notFound();
        var res = w.ciResult(slug, c.sha);
        page.append(el('h3', {}, [res.ok ? '✅ ' : '❌ ', r.ci.name, ' · ', c.msg.split('\n')[0]]),
          el('div', { class: 'gh-box' }, [el('div', { class: 'gh-box-h' }, [el('strong', {}, 'build'), el('span', { class: res.ok ? 'ok' : 'bad' }, res.ok ? 'succeeded' : 'failed')]),
            el('pre', { class: 'gh-log' }, res.log.join('\n'))]));
        S.act({ ev: { type: 'visit-run', ok: res.ok } });
        return;
      }
      var runs = [];
      Object.keys(r.refs).forEach(function (b) { w.walk([r.refs[b]]).slice(0, 4).forEach(function (c) { if (!runs.some(function (x) { return x.c.sha === c.sha; })) runs.push({ c: c, b: b }); }); });
      runs.sort(function (a, b) { return b.c.time - a.c.time; });
      page.append(el('div', { class: 'gh-box' }, [el('div', { class: 'gh-box-h' }, [el('strong', {}, 'All workflows'), el('span', { class: 'muted small' }, r.ci.name)]),
        el('ul', { class: 'gh-rows' }, runs.map(function (x) {
          var res = w.ciResult(slug, x.c.sha);
          return el('li', { class: 'gh-row' }, [el('span', { 'aria-label': res.ok ? 'success' : 'failure' }, res.ok ? '✅' : '❌'), el('div', { class: 'gh-grow' }, [link('/' + slug + '/actions/runs/' + x.c.sha, x.c.msg.split('\n')[0], { class: 'gh-link gh-strong' }),
            el('div', { class: 'muted small' }, r.ci.name + ' #' + w.short(x.c.sha) + ': ' + x.b)])]);
        }))]));
    }

    // ----- repository settings -----
    function repoSettings(slug, r, rest) {
      var sec = rest[0] || 'general', admin = w.roleRank(role(slug)) >= w.roleRank('admin');
      var nav = el('nav', { class: 'gh-sidenav' }, [['general', 'General'], ['access', 'Collaborators and teams'], ['rules', 'Rules › Rulesets']].map(function (x) {
        return link('/' + slug + '/settings' + (x[0] === 'general' ? '' : '/' + x[0]), x[1], { class: 'gh-sidelink' + (sec === x[0] ? ' on' : ''), 'data-id': 'settings-' + x[0], onclick: function (e) { e.preventDefault(); click('settings-' + x[0]); go('/' + slug + '/settings' + (x[0] === 'general' ? '' : '/' + x[0])); } });
      }));
      var body = el('div', { class: 'gh-settings-body' });
      if (sec === 'general') settingsGeneral(slug, r, body);
      else if (!admin) body.append(el('div', { class: 'gh-flash warn' }, T('gh.adminOnly', { role: ROLE_LABEL[role(slug)] })));
      else if (sec === 'access') settingsAccess(slug, r, body);
      else settingsRules(slug, r, body, rest[1]);
      page.append(el('div', { class: 'gh-settings' }, [nav, body]));
    }
    function dangerRow(title, text, label, action, onGo) {
      var ok = can(r_slug, action), why = ok ? '' : w.can(w.me, r_slug, action);
      return el('div', { class: 'gh-danger-row' }, [el('div', {}, [el('strong', {}, title), el('div', { class: 'small' }, text), !ok ? el('div', { class: 'small bad' }, '🔒 ' + T('gh.cannotBecause', { why: why })) : null]),
        btn(label, function () { click('danger-' + action); if (!ok) { denied(T('gh.cannotBecause', { why: why }), action, r_slug); return; } onGo(); }, 'gh-danger', { 'data-id': 'danger-' + action, 'aria-disabled': ok ? null : 'true' })]);
    }
    // Description and topics live behind the gear next to About, not in Settings (as on github.com)
    function aboutDialog(slug, r) {
      click('about-gear');
      var desc = el('input', { class: 'input', value: r.description || '', 'aria-label': 'Description' });
      var topics = el('input', { class: 'input', value: r.topics.join(' '), 'aria-label': 'Topics' });
      V.dialog(overlay, 'Edit repository details', el('div', { class: 'gui-form' }, [el('label', { class: 'field' }, [el('span', {}, 'Description'), desc]),
        el('label', { class: 'field' }, [el('span', {}, 'Topics (separate with spaces)'), topics])]), [{ label: T('common.cancel') }, { label: 'Save changes', primary: true, run: function () {
        act('repoSetting', { slug: slug, key: 'description', value: desc.value.trim() });
        act('repoSetting', { slug: slug, key: 'topics', value: topics.value.trim().toLowerCase().split(/[\s,]+/).filter(Boolean) });
        render();
      } }]);
    }
    var r_slug;
    function settingsGeneral(slug, r, body) {
      r_slug = slug;
      var name = el('input', { class: 'input gh-mini', value: r.name, 'aria-label': 'Repository name' });
      var tmpl = el('input', { type: 'checkbox', checked: r.template ? true : null });
      var maint = can(slug, 'settings');
      body.append(el('h2', {}, 'General'),
        el('section', { class: 'gh-set' }, [el('label', { class: 'field' }, [el('span', {}, 'Repository name'), el('span', { class: 'gh-copy-row' }, [name, btn('Rename', function () {
          var n = name.value.trim().replace(/[^\w.-]+/g, '-'); if (!n || n === r.name) return;
          if (w.server.repos[r.owner + '/' + n]) { denied(T('gh.nameTaken', { n: n })); return; }
          act('rename', { slug: slug, name: n }); go('/' + r.owner + '/' + n + '/settings');
        }, 'gh-sm', { disabled: maint ? null : true })])]),
          el('label', { class: 'gui-check' }, [tmpl, ' Template repository — ' + T('gh.templateHelp')]),
          btn('Save changes', function () {
            if (!!r.template !== tmpl.checked) act('repoSetting', { slug: slug, key: 'template', value: tmpl.checked });
            TDC.ui.toast(T('gh.saved'), 'ok'); render();
          }, 'gh-green gh-sm', { disabled: maint ? null : true })]),
        el('h3', { class: 'gh-danger-h' }, 'Danger Zone'),
        el('div', { class: 'gh-danger-zone' }, [
          dangerRow('Change repository visibility', T('gh.visNow', { v: visLabel(r) }), 'Change visibility', 'visibility', function () {
            var to = r.visibility === 'public' ? 'private' : 'public';
            confirmDialog('Change to ' + to, T('gh.visWarn', { v: to }), 'I want to make this repository ' + to, function () { act('visibility', { slug: slug, value: to }); render(); });
          }),
          dangerRow('Transfer ownership', T('gh.transferText'), 'Transfer', 'transfer', function () {
            var targets = Object.keys(w.server.orgs).filter(function (o) { var g = w.server.orgs[o]; return o !== r.owner && (g.owners.indexOf(w.me) >= 0 || (g.members.indexOf(w.me) >= 0 && g.settings.membersCanCreate)); });
            if (r.owner !== w.me && !w.server.orgs[w.me]) targets.unshift(w.me);
            var sel = el('select', { class: 'input', 'aria-label': 'New owner' }, targets.map(function (o) { return el('option', { value: o }, o); }));
            if (!targets.length) { denied(T('gh.noTransferTarget')); return; }
            V.dialog(overlay, 'Transfer repository', el('div', { class: 'gui-form' }, [el('p', { class: 'small' }, T('gh.transferHelp')), el('label', { class: 'field' }, [el('span', {}, 'New owner'), sel])]),
              [{ label: T('common.cancel') }, { label: 'I understand, transfer this repository', primary: true, run: function () {
                if (w.server.repos[sel.value + '/' + r.name]) { denied(T('gh.nameTaken', { n: r.name })); return false; }
                act('transfer', { slug: slug, to: sel.value }); go('/' + sel.value + '/' + r.name);
              } }]);
          }),
          dangerRow(r.archived ? 'Unarchive this repository' : 'Archive this repository', T(r.archived ? 'gh.unarchiveText' : 'gh.archiveText'), r.archived ? 'Unarchive this repository' : 'Archive this repository', 'archive', function () {
            confirmDialog(r.archived ? 'Unarchive repository' : 'Archive repository', T(r.archived ? 'gh.unarchiveText' : 'gh.archiveWarn'), r.archived ? 'Unarchive' : 'I understand the consequences, archive this repository', function () { act('archive', { slug: slug, value: !r.archived }); render(); });
          }),
          dangerRow('Delete this repository', T('gh.deleteText'), 'Delete this repository', 'delete', function () {
            confirmDialog('Delete ' + slug, T('gh.deleteWarn'), 'Delete this repository', function () { act('deleteRepo', { slug: slug }); go('/orgs/' + r.owner); TDC.ui.toast(T('gh.deleted', { s: slug }), 'warn'); }, slug);
          })
        ]));
    }
    function settingsAccess(slug, r, body) {
      var org = w.server.orgs[r.owner];
      var rows = [];
      if (org) Object.keys(org.teams).forEach(function (t) { if (org.teams[t].repos[slug]) rows.push({ team: t, name: org.teams[t].name, role: org.teams[t].repos[slug] }); });
      Object.keys(r.collaborators).forEach(function (l) { rows.push({ login: l, name: l, role: r.collaborators[l], outside: org && org.owners.concat(org.members).indexOf(l) < 0 }); });
      function roleSel(cur, on, label) {
        var s = el('select', { class: 'input gh-mini', 'aria-label': label, onchange: function () { on(s.value); } }, ['read', 'triage', 'write', 'maintain', 'admin'].map(function (x) { return el('option', { value: x, selected: x === cur ? true : null }, ROLE_LABEL[x]); }));
        return s;
      }
      body.append(el('h2', {}, 'Collaborators and teams'),
        el('div', { class: 'gh-access-cards' }, [
          el('div', { class: 'gh-box gh-pad' }, [el('strong', {}, visLabel(r) + ' repository'), el('div', { class: 'small muted' }, r.visibility === 'public' ? T('gh.publicAccess') : T('gh.privateAccess'))]),
          org ? el('div', { class: 'gh-box gh-pad' }, [el('strong', {}, 'Base role: ' + ROLE_LABEL[org.settings.basePermission]), el('div', { class: 'small muted' }, T('gh.baseRoleCard', { org: r.owner, role: ROLE_LABEL[org.settings.basePermission] })),
            org.owners.indexOf(w.me) >= 0 ? link('/orgs/' + r.owner + '/settings', T('gh.changeBase')) : null]) : null,
          el('div', { class: 'gh-box gh-pad' }, [el('strong', {}, T('gh.directAccess', { n: rows.length })), el('div', { class: 'small muted' }, T('gh.directAccessHelp'))])
        ]),
        el('div', { class: 'gh-box' }, [el('div', { class: 'gh-box-h' }, [el('strong', {}, 'Manage access'), el('span', { class: 'gh-grow' }),
          btn('Add people', function () { click('add-people'); addPeopleDialog(slug, org); }, 'gh-green gh-sm', { 'data-id': 'add-people' }),
          org ? btn('Add teams', function () { click('add-teams'); addTeamDialog(slug, org); }, 'gh-sm') : null]),
          rows.length ? el('ul', { class: 'gh-rows' }, rows.map(function (x) {
            return el('li', { class: 'gh-row' }, [x.team ? el('span', { class: 'gh-av sq', 'aria-hidden': 'true' }, '👥') : avatar(x.login), el('div', { class: 'gh-grow' }, [el('strong', {}, x.name), el('div', { class: 'muted small' }, x.team ? 'Team · ' + org.teams[x.team].members.length + ' members' : x.outside ? 'Outside collaborator' : 'Member of ' + r.owner)]),
              roleSel(x.role, function (v) { if (x.team) act('teamRepo', { org: r.owner, team: x.team, slug: slug, role: v }); else act('collab', { slug: slug, login: x.login, role: v }); render(); }, T('gh.roleOf', { u: x.name })),
              btn('Remove', function () { if (x.team) act('teamRepo', { org: r.owner, team: x.team, slug: slug, role: null }); else act('collab', { slug: slug, login: x.login, role: null }); render(); }, 'gh-mini-btn gh-danger-text')]);
          })) : el('p', { class: 'muted gh-pad' }, T('gh.noDirectAccess'))]));
    }
    function addPeopleDialog(slug, org) {
      var login = el('input', { class: 'input', 'aria-label': T('gh.usernameOrEmail'), placeholder: 'ben' });
      var rsel = el('select', { class: 'input', 'aria-label': 'Role' }, ['read', 'triage', 'write', 'maintain', 'admin'].map(function (x) { return el('option', { value: x, selected: x === 'write' ? true : null }, ROLE_LABEL[x] + ' — ' + T('gh.roleDesc.' + x)); }));
      V.dialog(overlay, 'Add people to ' + slug.split('/')[1], el('div', { class: 'gui-form' }, [el('label', { class: 'field' }, [el('span', {}, T('gh.usernameOrEmail')), login]), el('label', { class: 'field' }, [el('span', {}, 'Choose a role'), rsel]),
        org ? el('p', { class: 'muted small' }, T('gh.outsideNote', { org: org.name })) : null]),
        [{ label: T('common.cancel') }, { label: 'Add to repository', primary: true, run: function () {
          var l = login.value.trim().replace(/^@/, ''); if (!l) return false;
          if (!w.server.users[l]) { denied(T('gh.noSuchUser', { u: l })); return false; }
          act('collab', { slug: slug, login: l, role: rsel.value });
          if (org && org.owners.concat(org.members).indexOf(l) < 0 && org.outside.indexOf(l) < 0) org.outside.push(l);
          render();
        } }]);
    }
    function addTeamDialog(slug, org) {
      var free = Object.keys(org.teams).filter(function (t) { return !org.teams[t].repos[slug]; });
      if (!free.length) { denied(T('gh.allTeamsAdded')); return; }
      var tsel = el('select', { class: 'input', 'aria-label': 'Team' }, free.map(function (t) { return el('option', { value: t }, org.teams[t].name); }));
      var rsel = el('select', { class: 'input', 'aria-label': 'Role' }, ['read', 'triage', 'write', 'maintain', 'admin'].map(function (x) { return el('option', { value: x }, ROLE_LABEL[x]); }));
      V.dialog(overlay, 'Add teams', el('div', { class: 'gui-form' }, [el('label', { class: 'field' }, [el('span', {}, 'Team'), tsel]), el('label', { class: 'field' }, [el('span', {}, 'Choose a role'), rsel])]),
        [{ label: T('common.cancel') }, { label: 'Add selection', primary: true, run: function () { act('teamRepo', { org: org.name, team: tsel.value, slug: slug, role: rsel.value }); render(); } }]);
    }
    function settingsRules(slug, r, body, which) {
      if (which != null) return ruleForm(slug, r, body, which === 'new' ? null : +which);
      body.append(el('div', { class: 'gh-box-h' }, [el('h2', {}, 'Rulesets'), btn('New ruleset ▾', function (e) {
        click('new-ruleset');
        TDC.ui.popover(e.currentTarget, el('div', { class: 'gui-menu' }, [el('button', { class: 'gui-menu-item', onclick: function () { TDC.ui.closePopover(); go('/' + slug + '/settings/rules/new'); } }, 'New branch ruleset'),
          el('button', { class: 'gui-menu-item', onclick: function () { TDC.ui.closePopover(); denied(T('gh.notInSim')); } }, 'New tag ruleset')]));
      }, 'gh-green gh-sm', { 'data-id': 'new-ruleset' })]),
        el('p', { class: 'muted small' }, T('gh.rulesetsHelp')),
        r.rules.length ? el('ul', { class: 'gh-rows gh-box' }, r.rules.map(function (x, i) {
          return el('li', { class: 'gh-row' }, [el('span', { 'aria-hidden': 'true' }, '🛡'), link('/' + slug + '/settings/rules/' + i, x.name, { class: 'gh-link gh-strong' }), el('span', { class: 'gh-label' + (x.enforcement === 'disabled' ? '' : ' ok') }, x.enforcement === 'disabled' ? 'Disabled' : 'Active'),
            el('span', { class: 'muted small' }, describeRule(x))]);
        })) : el('p', { class: 'muted' }, T('gh.noRulesets')));
    }
    function describeRule(x) {
      var parts = [];
      if (x.blockDelete) parts.push('Restrict deletions'); if (x.requirePR) parts.push('Require PR (' + plural(x.approvals || 0, 'approval') + ')');
      if (x.codeowners) parts.push('Code owners'); if (x.requireChecks) parts.push('Status checks'); if (x.blockForce) parts.push('Block force pushes');
      return (x.target === '~ALL' ? 'All branches' : x.target === '~DEFAULT_BRANCH' || !x.target ? 'Default branch' : x.target) + ' · ' + (parts.join(', ') || 'no rules');
    }
    function ruleForm(slug, r, body, idx) {
      var x = idx != null ? JSON.parse(JSON.stringify(r.rules[idx])) : { name: '', enforcement: 'active', target: '~DEFAULT_BRANCH', bypass: [], blockDelete: true, blockForce: true };
      var name = el('input', { class: 'input', value: x.name, 'aria-label': 'Ruleset Name' });
      var enf = el('select', { class: 'input gh-mini', 'aria-label': 'Enforcement status' }, [['active', 'Active'], ['disabled', 'Disabled']].map(function (o) { return el('option', { value: o[0], selected: x.enforcement === o[0] ? true : null }, o[1]); }));
      var tgt = el('select', { class: 'input gh-mini', 'aria-label': 'Target branches' }, [['~DEFAULT_BRANCH', 'Include default branch'], ['~ALL', 'Include all branches']].concat(Object.keys(r.refs).filter(function (b) { return b !== r.defaultBranch; }).map(function (b) { return [b, 'Include by pattern: ' + b]; }))
        .map(function (o) { return el('option', { value: o[0], selected: x.target === o[0] ? true : null }, o[1]); }));
      var by = el('input', { class: 'input', value: (x.bypass || []).join(', '), 'aria-label': 'Bypass list', placeholder: 'admins, teacher' });
      function cb(key, label, help) { var c = el('input', { type: 'checkbox', checked: x[key] ? true : null, 'data-key': key }); return el('label', { class: 'gh-check-row' }, [c, el('span', {}, [el('strong', {}, label), help ? el('div', { class: 'muted small' }, help) : null])]); }
      var appr = el('select', { class: 'input gh-mini', 'aria-label': 'Required approvals' }, [0, 1, 2, 3].map(function (n) { return el('option', { value: n, selected: (x.approvals || 0) === n ? true : null }, String(n)); }));
      var form = el('div', {}, [el('h2', {}, idx != null ? 'Edit ruleset' : 'New branch ruleset'),
        el('section', { class: 'gh-set' }, [el('label', { class: 'field' }, [el('span', {}, 'Ruleset Name *'), name]), el('label', { class: 'field' }, [el('span', {}, 'Enforcement status'), enf])]),
        el('section', { class: 'gh-set' }, [el('h3', {}, 'Bypass list'), el('p', { class: 'muted small' }, T('gh.bypassHelp')), by]),
        el('section', { class: 'gh-set' }, [el('h3', {}, 'Target branches'), tgt]),
        el('section', { class: 'gh-set gh-rules' }, [el('h3', {}, 'Branch rules'),
          cb('blockDelete', 'Restrict deletions', 'Only allow users with bypass permissions to delete matching refs.'),
          cb('restrictPush', 'Restrict updates', 'Only allow users with bypass permission to update matching refs.'),
          cb('requirePR', 'Require a pull request before merging', 'Require all commits be made to a non-target branch and submitted via a pull request before they can be merged.'),
          el('label', { class: 'field gh-indent' }, [el('span', {}, 'Required approvals'), appr]),
          cb('codeowners', 'Require review from Code Owners', 'Require an approving review in pull requests that modify files that have a designated code owner.'),
          cb('requireChecks', 'Require status checks to pass', 'Choose which status checks must pass before the ref is updated.'),
          cb('blockForce', 'Block force pushes', 'Prevent users with push access from force pushing to refs.')]),
        el('div', { class: 'btn-row' }, [btn(idx != null ? 'Save changes' : 'Create', function () {
          if (!name.value.trim()) { denied(T('gh.needName')); return; }
          var rule = { name: name.value.trim(), enforcement: enf.value, target: tgt.value, bypass: by.value.split(/[\s,]+/).filter(Boolean), approvals: +appr.value };
          form.querySelectorAll('input[data-key]').forEach(function (c) { rule[c.dataset.key] = c.checked; });
          act('ruleSave', { slug: slug, i: idx, rule: rule }); go('/' + slug + '/settings/rules');
          TDC.ui.toast(T('gh.rulesetSaved'), 'ok');
        }, 'gh-green', { 'data-id': 'save-ruleset' }), idx != null ? btn('Delete ruleset', function () { act('ruleDelete', { slug: slug, i: idx }); go('/' + slug + '/settings/rules'); }, 'gh-danger') : null])]);
      body.append(form);
    }
    function forkDialog(slug) {
      if (!can(slug, 'fork')) { denied(T('gh.cannotFork'), 'fork', slug); return; }
      var src = w.server.repos[slug], o = w.server.orgs[src.owner];
      if (src.visibility !== 'public' && o && !o.settings.membersCanFork) { denied(T('gh.forkDisabled'), 'fork', slug); return; }
      var ns = w.me + '/' + src.name;
      if (w.server.repos[ns]) { go('/' + ns); return; }
      V.dialog(overlay, 'Create a new fork', el('div', { class: 'gui-form' }, [el('p', { class: 'small' }, T('gh.forkHelp')), el('p', {}, el('b', {}, 'Owner: ' + w.me + ' / ' + src.name))]),
        [{ label: T('common.cancel') }, { label: 'Create fork', primary: true, run: function () { act('fork', { slug: slug }); go('/' + ns); } }]);
    }

    w = S.boot();
    if (term) term.boot();
    render();
    return { world: function () { return w; } };
  });
})(window.TDC);
