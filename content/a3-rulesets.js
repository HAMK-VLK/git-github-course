/* a3 = Protecting the main branch: rulesets and reviews (github.com simulator + embedded Git Bash). */
(function () {
  var SLUG = 'hamk-projects/thesis-aino';
  var URL = 'https://github.com/' + SLUG + '.git';
  var CFG = { 'user.name': 'Aino Student', 'user.email': 'aino@example.com', 'init.defaultBranch': 'main' };
  var ORGS = { 'hamk-projects': { displayName: 'HAMK Projects', owners: ['teacher'], members: ['aino', 'ben'], settings: { basePermission: 'read' },
    teams: { 'thesis-2026': { name: 'Thesis 2026', members: ['aino'], repos: { 'hamk-projects/thesis-aino': 'write' } } } } };
  var USERS = { teacher: { name: 'Tiina Teacher' }, ben: { name: 'Ben Opiskelija' } };
  function remote(rules) {
    var o = { description: 'Bachelor thesis: version control at HAMK', collaborators: { teacher: 'admin' },
      commits: [
        { msg: 'Initial commit', author: 'teacher', files: { 'README.md': '# Thesis: Aino Student\n\nSupervisor: @teacher\n' } },
        { msg: 'Add chapter 1 draft', author: 'aino', files: { 'chapters/01-intro.md': '# Introduction\n\nVersion control keeps...\n' } }
      ] };
    if (rules) o.rules = rules;
    var r = {}; r[SLUG] = o; return r;
  }
  var PROTECT = { name: 'Protect main', enforcement: 'active', target: '~DEFAULT_BRANCH', bypass: [], blockDelete: true, blockForce: true, requirePR: true, approvals: 1 };

  // Widget 1: the teacher builds the ruleset on an unprotected repository.
  var W1 = { me: 'teacher', myName: 'Tiina Teacher', config: { 'user.name': 'Tiina Teacher', 'user.email': 'teacher@example.com' }, users: USERS, orgs: ORGS, remotes: remote(null), run: [] };
  function rules(w) { return w.server.repos[SLUG].rules; }
  function protectsMain(x) { return x.enforcement === 'active' && (x.target || '~DEFAULT_BRANCH') === '~DEFAULT_BRANCH'; }

  // Widget 2: the rule is on; Aino has a clone and tries to push to main.
  var W2 = { me: 'aino', myName: 'Aino Student', config: CFG, users: USERS, orgs: ORGS, remotes: remote([PROTECT]), cwd: '~', run: ['git clone ' + URL, 'cd thesis-aino'] };
  function pr(w) { return w.server.repos[SLUG].pulls[0]; }

  TDC.registerTopic({
    id: 'a3',
    title: 'Protecting the main branch: rulesets and reviews',
    subtitle: 'Everyone can read and clone, but nothing reaches main without an approved pull request.',
    audience: 'teachers, supervisors and org owners · you know branches and pull requests',
    objectives: [
      'explain why the main branch of a school repository is protected',
      'create a ruleset that requires a pull request with an approval and blocks force pushes and deletion',
      'describe code owner review, status checks, stale approvals and the bypass list',
      'read the GH013 error that a rejected push shows',
      'take a change from branch to approved, merged pull request'
    ],
    glossary: {
      ruleset: { term: 'ruleset', def: 'A set of rules for a repository that GitHub enforces on chosen branches, for example "changes only through a pull request with one approval".' },
      pullrequest: { term: 'pull request', def: 'A request to merge the commits of one branch into another. Others can read the changes, comment and approve before the merge.' },
      codeowners: { term: 'code owner', def: 'A person or team named in a CODEOWNERS file as responsible for certain files. A ruleset can require their approval for changes to those files.' },
      bypass: { term: 'bypass list', def: 'The people, teams or roles that a ruleset does not apply to. Keep it short, or empty.' }
    },
    commands: [
      { cmd: 'git switch -c <branch>', does: 'Move your commits onto a new branch (also the way out after a rejected push to main)' },
      { cmd: 'git push -u origin <branch>', does: 'Publish a branch; GitHub then offers to open a pull request' }
    ],
    sections: [
      { id: 'a3-why', title: 'Why protect main', blocks: [
        { id: 'a3-why-t', type: 'text', html: '<p>The <code>main</code> branch of a repository is what everybody sees: it is the version that is graded, published or handed over. If anyone with <b>Write</b> access can push straight to it, one slip (a wrong file, a force push that rewrites history, a deleted branch) changes the shared copy for everybody.</p><p>The school rule is simple: <b>everyone can read and clone, but nobody changes <code>main</code> without an approved <dfn data-term="pullrequest">pull request</dfn></b>. Work happens on a branch, a second person looks at it, and only then is it merged.</p>' },
        { id: 'a3-why-ex', type: 'callout', kind: 'school', title: 'Example: a thesis repository', html: 'Aino has <b>Write</b> access to <code>hamk-projects/thesis-aino</code>. Without protection she could, by accident, force-push an old version over <code>main</code> the night before the deadline. With protection she can still push branches and open pull requests, and her supervisor approves what reaches <code>main</code>.' },
        { id: 'a3-why-c', type: 'callout', kind: 'info', title: 'Roles are not enough', html: 'Repository roles (previous lesson) decide <em>what a person may do in general</em>. A ruleset adds conditions for one branch: even someone with Write may not push to a protected branch. Settings and the ability to merge still follow the role.' },
        { id: 'a3-q-why-blk', type: 'question', q: 'a3-q-why' }
      ] },
      { id: 'a3-rules', title: 'Create a ruleset', blocks: [
        { id: 'a3-rules-t', type: 'text', html: 'GitHub calls the modern feature <b>rulesets</b>. You find them in a repository under <b>Settings → Rules → Rulesets</b>. An older feature, <b>branch protection rules</b> (<b>Settings → Branches</b>), does the same job with fewer options and you will still meet it in older repositories; new work should use rulesets.' },        { id: 'a3-rules-tbl', type: 'table', head: ['Setting in the ruleset', 'What it does'], rows: [
          ['<b>Enforcement status</b>: Active / Disabled', 'Turn the rules on, or keep them saved but off while you test.'],
          ['<b>Target branches</b>: Include default branch', 'Which branch the rules apply to. For school work: the default branch, usually <code>main</code>.'],
          ['<b>Restrict deletions</b>', 'Nobody can delete the branch.'],
          ['<b>Require a pull request before merging</b> + <b>Required approvals</b>', 'Changes arrive only through a pull request that has the set number of approvals.'],
          ['<b>Block force pushes</b>', 'Nobody can rewrite the history of the branch.'],
          ['<b>Require status checks to pass</b>', 'Automatic checks (for example "the thesis builds") must be green before merging.'],
          ['<b>Bypass list</b>', 'People or roles the ruleset does not apply to.']
        ], compact: true },        { id: 'a3-rules-plan', type: 'callout', kind: 'staff', title: 'Plan limits', html: 'Rulesets work in public repositories on every plan. In <em>private</em> repositories they need a paid plan (GitHub Team or Enterprise). Check with IT which plan the school organization has.' },        { id: 'a3-rules-intro', type: 'text', html: '<p>You are <b>teacher</b>, the owner of the organization. The repository has no rules yet. Create the ruleset that protects <code>main</code>.</p>' },
        { id: 'a3-rules-sim', type: 'interactive', widget: 'github', title: 'Create the "Protect main" ruleset',
          caption: 'Go to <b>Settings → Rules</b>, open <b>New ruleset ▾ → New branch ruleset</b>, tick the rules and click <b>Create</b>.',
          config: {
            start: '/' + SLUG + '/settings/rules', personas: ['teacher'], terminal: false, world: W1,
            tasks: [
              { id: 'new', text: 'Open <b>New ruleset ▾</b> and choose <b>New branch ruleset</b>', check: function (w) { return w.did('click', function (e) { return e.id === 'new-ruleset'; }); }, solution: 'Settings → Rules → Rulesets → New ruleset ▾ → New branch ruleset' },
              { id: 'pr', text: 'Name it <b>Protect main</b>, keep it <b>Active</b>, target the default branch, require a pull request with <b>1 approval</b>, and click <b>Create</b>',
                check: function (w) { return rules(w).some(function (x) { return protectsMain(x) && x.requirePR && x.approvals >= 1; }); },
                hint: 'Tick "Require a pull request before merging", then set Required approvals to 1.', solution: 'Name: Protect main → tick Require a pull request before merging → Required approvals: 1 → Create' },
              { id: 'safe', text: 'Edit the ruleset so it also has <b>Restrict deletions</b> and <b>Block force pushes</b> ticked',
                check: function (w) { return rules(w).some(function (x) { return protectsMain(x) && x.requirePR && x.blockDelete && x.blockForce; }); },
                hint: 'Open the ruleset from the list, tick both boxes, Save changes. They may already be ticked when you create it: check them.' }
            ] } },
        { id: 'a3-q-which-blk', type: 'question', q: 'a3-q-which' }
      ] },
      { id: 'a3-reviews', title: 'Reviews, code owners and checks', blocks: [
        { id: 'a3-rev-t', type: 'text', html: '<p>"Require a pull request" has more dials. Each one makes the review stricter:</p>' },
        { id: 'a3-rev-list', type: 'list', items: [
          '<b>Required approvals</b>: how many people must approve. The author of the pull request can never approve their own. For a thesis, 1 (the supervisor) is usual.',
          '<b>Dismiss stale pull request approvals when new commits are pushed</b>: if Aino adds a commit after the supervisor approved, the approval is cleared and the supervisor must look again. Without it a student could get approval and then change the work.',          '<b>Require review from Code Owners</b>: a file called <code>CODEOWNERS</code> names who is responsible for which files, for example <code>/chapters/ @teacher</code>. A change to those files needs an approval from a <dfn data-term="codeowners">code owner</dfn>.',          '<b>Require status checks to pass</b>: an automatic check, such as a build or a spell check, has to succeed first.'
        ] },
        { id: 'a3-rev-code', type: 'code', lang: 'text', title: '.github/CODEOWNERS', code: '# Chapters need the supervisor\n/chapters/  @teacher\n# Everything else: IT\n*           @it-admin' },
        { id: 'a3-rev-c', type: 'callout', kind: 'warn', title: 'Simulator limit', html: 'The practice site offers <b>Required approvals</b>, code owners and status checks. It does not have the stale-approval switch, so you will not find it in the exercises, but the real ruleset page does.' },
        { id: 'a3-q-owner-blk', type: 'question', q: 'a3-q-owner' },
        { id: 'a3-byp-h', type: 'h', text: 'The bypass list' },
        { id: 'a3-byp-t', type: 'text', html: '<p>The <dfn data-term="bypass">bypass list</dfn> names who the ruleset does not apply to. Being the organization owner or a repository admin does <b>not</b> put you on it automatically: add yourself, a team or the <b>Repository admin</b> role if you want an emergency route. Everything done through the bypass is recorded, but the safest list is an empty one.</p>' },        { id: 'a3-q-bypass-blk', type: 'question', q: 'a3-q-bypass' }
      ] },
      { id: 'a3-push', title: 'What the learner sees: a rejected push', blocks: [
        { id: 'a3-push-t', type: 'text', html: '<p>The ruleset is now on. Aino has a clone of <code>thesis-aino</code> and, as always, commits on <code>main</code> and pushes. Git on her computer is fine with it; <b>GitHub refuses</b> and prints an error that starts with <code>GH013</code>:</p>' },
        { id: 'a3-push-code', type: 'code', lang: 'bash', code: '$ git push\nremote: error: GH013: Repository rule violations found for refs/heads/main.\nremote: Review all repository rules at https://github.com/hamk-projects/thesis-aino/rules?ref=refs%2Fheads%2Fmain\nremote:\nremote: - Changes must be made through a pull request.\nremote:\nTo https://github.com/hamk-projects/thesis-aino.git\n ! [remote rejected] main -> main (push declined due to repository rule violations)\nerror: failed to push some refs to \'https://github.com/hamk-projects/thesis-aino.git\'' },
        { id: 'a3-push-read', type: 'text', html: '<p>Read it from the middle: the line starting <code>remote: -</code> says <em>why</em> (here: use a pull request). <code>[remote rejected]</code> means the server said no, so nothing was uploaded and nothing is lost: her commit is still safe on her computer.</p>' },
        { id: 'a3-push-h', type: 'h', text: 'The way forward' },
        { id: 'a3-push-steps', type: 'list', steps: true, items: [
          'Move the commit onto a branch: <code>git switch -c fix-intro</code> (a new branch starts where you are, so your commit comes along).',
          'Push the branch: <code>git push -u origin fix-intro</code>. Branches are not protected, so this works, and GitHub prints a link to open a pull request.',
          'On github.com open the pull request (<b>Compare &amp; pull request</b> → <b>Create pull request</b>) and ask the supervisor to review.',
          'The supervisor opens <b>Files changed</b>, clicks <b>Review changes</b>, chooses <b>Approve</b> and <b>Submit review</b>.',
          'Now <b>Merge pull request</b> is available. Before the approval the merge box says a review is required.'
        ] },        { id: 'a3-push-c', type: 'callout', kind: 'tip', title: 'Local main stays one commit ahead', html: 'After the move, your local <code>main</code> still contains the commit, but GitHub\'s does not until the pull request is merged. After the merge, <code>git switch main</code> and <code>git pull</code> bring your <code>main</code> level with GitHub.' },
        { id: 'a3-push-intro', type: 'text', html: '<p>Your turn. The ruleset <b>Protect main</b> (1 approval, no force pushes, no deletion) is active. You start as <b>aino</b> in her clone. Use the <b>Practise as</b> buttons to become <b>teacher</b> when it is time to approve.</p>' },
        { id: 'a3-push-sim', type: 'interactive', widget: 'github', title: 'Get a change into main the approved way',
          caption: 'Terminal for the commit and pushes, browser for the pull request. Switch between <b>aino</b> and <b>teacher</b> with the Practise as buttons.',
          config: {
            start: '/' + SLUG, personas: ['aino', 'teacher'], terminal: true, world: W2,
            tasks: [
              { id: 'reject', text: 'Change <code>README.md</code>, commit on <code>main</code> and try <code>git push</code>: it is rejected',
                check: function (w) { return w.log.some(function (l) { return /^git push/.test(l.cmd) && l.code; }); },
                hint: 'echo "Draft 2" >> README.md, git commit -am "Update readme", git push', solution: 'echo "Draft 2" >> README.md\ngit commit -am "Update readme"\ngit push' },
              { id: 'branch', text: 'Move the commit to a new branch <code>fix-intro</code> and push it',
                check: function (w) { return !!w.server.repos[SLUG].refs['fix-intro']; },
                hint: 'git switch -c fix-intro, then git push -u origin fix-intro', solution: 'git switch -c fix-intro\ngit push -u origin fix-intro' },
              { id: 'pr', text: 'As <b>aino</b>, open a pull request from <code>fix-intro</code> into <code>main</code>',
                check: function (w) { var p = pr(w); return !!p && p.head === 'fix-intro' && p.base === 'main'; },
                hint: 'Pull requests tab → New pull request, or the Compare &amp; pull request banner.', solution: 'Pull requests → New pull request → base: main, compare: fix-intro → Create pull request' },
              { id: 'blocked', text: 'Open the pull request page and find why <b>Merge pull request</b> is greyed out',
                check: function (w) { return w.did('visit', function (e) { return /\/pull\/\d+$/.test(e.path); }); },
                hint: 'Click the pull request title. The box above the merge button tells you what is missing.' },
              { id: 'approve', text: 'Switch to <b>teacher</b> and approve the pull request',
                check: function (w) { var p = pr(w); return !!p && p.reviews.some(function (r) { return r.state === 'approved' && r.user === 'teacher'; }); },
                hint: 'Files changed → Review changes → Approve → Submit review.', solution: 'Files changed → Review changes → Approve → Submit review' },
              { id: 'merge', text: 'Merge the pull request',
                check: function (w) { var p = pr(w); return !!p && p.state === 'merged'; },
                hint: 'Now the Merge pull request button is green.', solution: 'Merge pull request → Confirm merge' }
            ] } },
        { id: 'a3-q-gh013-blk', type: 'question', q: 'a3-q-gh013' },
        { id: 'a3-q-order-blk', type: 'question', q: 'a3-q-order' }
      ] },
      { id: 'a3-summary', title: 'Summary', blocks: [
        { id: 'a3-sum-list', type: 'list', items: [
          'Protect <code>main</code> so that everyone can read and clone, but changes arrive only through an approved pull request.',
          'Create a ruleset under <b>Settings → Rules</b>: target the default branch, require a pull request with approvals, restrict deletions, block force pushes. Branch protection rules are the older name for the same idea.',
          'Stricter options: dismiss stale approvals, code owner review via <code>CODEOWNERS</code>, required status checks.',
          'The bypass list should stay empty or tiny; owners and admins are not on it automatically.',
          'A rejected push shows <code>GH013</code> and the reason after <code>remote: -</code>. Nothing is lost: move the commit to a branch and open a pull request.'
        ] }
      ] }
    ],
    questions: [
      { id: 'a3-q-why', type: 'mc', prompt: 'Aino has Write access to the thesis repository. What does a ruleset on <code>main</code> change for her?',
        options: ['She loses Write access to the whole repository', 'She can still push branches and open pull requests, but cannot push straight to <code>main</code>', 'She can push to <code>main</code> only on weekdays', 'Nothing: Write access always overrides rulesets'],
        answer: 1, hints: ['A ruleset adds conditions for a branch; it does not remove the role.'], explain: 'The role stays, but the rule adds conditions on <code>main</code>: changes must come through an approved pull request. Other branches are unaffected.' },
      { id: 'a3-q-which', type: 'multi', prompt: 'Which settings together give "no force pushes, no deleting main, and changes only with one approval"?',
        options: ['Block force pushes', 'Restrict deletions', 'Require a pull request before merging with 1 required approval', 'Require status checks to pass', 'Add everyone to the bypass list'],
        answer: [0, 1, 2], hints: ['Status checks are about automatic tests, not approvals.'], explain: 'The three rules cover those three wishes. Status checks are an extra, and a full bypass list would switch the protection off for those people.' },
      { id: 'a3-q-owner', type: 'mc', prompt: 'The file <code>/chapters/ @teacher</code> is in <code>CODEOWNERS</code> and the ruleset requires code owner review. Ben changes a chapter, and Aino (not a code owner) approves. What happens?',
        options: ['The pull request can be merged: it has an approval', 'It cannot be merged until a code owner (the teacher) approves', 'Ben becomes a code owner', 'The CODEOWNERS file is ignored'],
        answer: 1, hints: ['Whose approval counts for the files in /chapters/?'], explain: 'With code owner review required, an approval from someone who is not an owner of the changed files does not satisfy the rule.' },
      { id: 'a3-q-bypass', type: 'mc', prompt: 'Teacher is the owner of the organization and not on the ruleset bypass list. She pushes a commit straight to <code>main</code>. What happens?',
        options: ['It works: owners are always exempt', 'It is rejected like for everybody else', 'It works, but only before 17:00', 'GitHub asks Aino to approve'],
        answer: 1, hints: ['Think about who the bypass list names.'], explain: 'Rulesets apply to admins and owners too, unless they are on the bypass list. That is a feature: even the supervisor goes through a pull request.' },
      { id: 'a3-q-gh013', type: 'mc', prompt: 'Your <code>git push</code> ends with <code>! [remote rejected] main -> main (push declined due to repository rule violations)</code>. What is the best next step?',
        options: ['Run <code>git push --force</code>', 'Delete the repository and clone again', 'Create a branch with <code>git switch -c</code>, push it and open a pull request', 'Ask the owner to make you Admin'],
        answer: 2, hints: ['Your commit is still safe locally.'], explain: 'Force does not help (force pushes are blocked as well) and becoming Admin is the wrong fix for a rule that exists on purpose. Branch, push, pull request.' },
      { id: 'a3-q-order', type: 'order', prompt: 'Put the steps in order.', items: ['Commit on a new branch', 'Push the branch', 'Open a pull request', 'Supervisor approves', 'Merge into main'],
        explain: 'Work goes on a branch, the branch is pushed, a pull request asks for review, and only an approved pull request can be merged into <code>main</code>.' }
    ]
  });
})();
