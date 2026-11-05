/* e6 = Team workflows and the capstone. Concept sections + two github simulators (with embedded Git Bash):
 * (1) set up a thesis repository from a template, (2) run one change through branch, push, PR, review, merge, release, archive. */
(function () {
  var ORG = 'hamk-projects', TPL = ORG + '/thesis-template', THESIS = ORG + '/thesis-aino';
  var ROLE_RANK = { none: 0, read: 1, triage: 2, write: 3, maintain: 4, admin: 5 };
  var USERS = { teacher: { name: 'Tiina Teacher' }, ben: { name: 'Ben Opiskelija' }, aino: { name: 'Aino Student' } };
  var ORGS = {}; ORGS[ORG] = { displayName: 'HAMK Projects', owners: ['teacher'], members: ['aino', 'ben'], settings: { basePermission: 'read' }, teams: {} };

  // the repository the "setup" simulator creates from the template (anything in the org except the template itself)
  function made(w) {
    var s = Object.keys(w.server.repos).filter(function (k) { return k !== TPL && k.indexOf(ORG + '/') === 0; })[0];
    return s ? w.server.repos[s] : null;
  }
  function pull(w) { var r = w.server.repos[THESIS]; return r && r.pulls[0]; }

  TDC.registerTopic({
    id: 'e6',
    title: 'Team workflows and the capstone',
    subtitle: 'Pick a team workflow, write clear commits, and run a whole thesis project from template to archive.',
    audience: 'everyone who has done the basics · expert level',
    objectives: [
      'compare GitHub flow, Git flow and trunk-based development and choose one for a school project',
      'write conventional commit messages and explain what signed commits prove',
      'use CODEOWNERS to route reviews, and decide between one repository and many',
      'set up a thesis repository end to end: template, access, ruleset, issue',
      'take one change through branch, push, pull request, review, merge, release and archive'
    ],
    glossary: {
      wfflow: { term: 'GitHub flow', def: 'A simple team workflow: the main branch is always good, every change happens on a short-lived branch and reaches main through a reviewed pull request.' },
      wftrunk: { term: 'trunk-based development', def: 'A workflow where everybody merges small changes into main very often (at least daily) and keeps branches very short.' },
      wfconv: { term: 'conventional commits', def: 'A convention for commit messages: a type, an optional scope and a short description, for example "feat(chapter-2): add methods section".' },
      wfsigned: { term: 'signed commit', def: 'A commit with a cryptographic signature (GPG, SSH or S/MIME key). GitHub shows a "Verified" badge when the signature matches a key on the author\'s account.' },
      wfowners: { term: 'CODEOWNERS', def: 'A file that lists who owns which files. When a pull request changes owned files, GitHub asks those owners to review it.' }
    },
    commands: [
      { cmd: 'git clone <url>', does: 'Copy the repository to your computer' },
      { cmd: 'git switch -c <branch>', does: 'Create and switch to a new branch for your change' },
      { cmd: 'git push -u origin <branch>', does: 'Publish the branch to GitHub and remember it as upstream' },
      { cmd: 'git commit -m "feat: add methods section"', does: 'Commit with a conventional commit message' },
      { cmd: 'git pull', does: 'Update your local main after the pull request was merged' }
    ],
    sections: [
      { id: 'e6-flows', title: 'Three ways a team can work', blocks: [
        { id: 'e6-t1', type: 'text', html: '<p>Git does not tell a team <em>how</em> to use branches. A <b>workflow</b> is an agreement: where do changes start, who checks them, and when do they reach the main branch? Three common agreements exist.</p>' },
        { id: 'e6-tbl', type: 'table', head: ['Workflow', 'How it works', 'Good for'],
          rows: [
            ['<dfn data-term="wfflow">GitHub flow</dfn>', '<code>main</code> is always good. Every change: new branch, pull request, review, merge, delete the branch.', 'Almost every school project, theses, course material, websites'],
            ['Git flow', 'Long-lived <code>main</code> and <code>develop</code> branches, plus <code>feature/</code>, <code>release/</code> and <code>hotfix/</code> branches.', 'Software shipped in numbered versions, several versions supported at once'],
            ['<dfn data-term="wftrunk">Trunk-based</dfn>', 'Everyone merges small changes to <code>main</code> at least daily; branches live hours, not weeks. Needs automatic tests.', 'Experienced teams with good automation']
          ] },
        { id: 'e6-c1', type: 'callout', kind: 'school', title: 'At HAMK', html: 'Start with <b>GitHub flow</b>. It needs no extra branches to remember, it fits the rule "nobody pushes to main, everything goes through a reviewed pull request", and it works for a thesis with one student and one supervisor as well as for a team of six.' },
        { id: 'e6-q1', type: 'question', q: 'e6-q-flow' },
        { id: 'e6-w1', type: 'callout', kind: 'warn', title: 'Common mistake', html: 'Using Git flow because it looks professional. Two permanent branches and three kinds of temporary branches are a lot of rules for a group that releases once, at hand-in.' }
      ] },
      { id: 'e6-commits', title: 'Clear commits: conventional and signed', blocks: [
        { id: 'e6-t2', type: 'text', html: '<p><dfn data-term="wfconv">Conventional commits</dfn> give every message the same shape, so a long history is easy to scan and tools can build change logs from it:</p>' },
        { id: 'e6-code1', type: 'code', lang: 'text', code: '<type>(<scope>): <short description>\n\nfeat(chapter-2): add methods section\nfix(figures): correct the axis label in figure 3\ndocs: explain how to build the PDF\nchore: update .gitignore' },
        { id: 'e6-t3', type: 'text', html: '<p>Common types: <code>feat</code> (new content or feature), <code>fix</code> (correction), <code>docs</code> (documentation), <code>refactor</code>, <code>test</code> and <code>chore</code> (housekeeping). The scope in brackets is optional. Keep the first line under about 72 characters and write it as an order: "add", not "added".</p>' },
        { id: 'e6-q2', type: 'question', q: 'e6-q-conv' },
        { id: 'e6-t4', type: 'text', html: '<p>Anyone can set <code>user.name</code> to someone else\'s name, so a commit\'s author is only a claim. A <dfn data-term="wfsigned">signed commit</dfn> adds a signature made with your private key. If the public key is saved on your GitHub account <em>as a signing key</em> (<b>Settings → SSH and GPG keys → New SSH key</b>, key type <b>Signing Key</b>), the commit shows a green <b>Verified</b> badge.</p>' },        { id: 'e6-code2', type: 'code', lang: 'bash', code: '$ git config --global gpg.format ssh\n$ git config --global user.signingkey ~/.ssh/id_ed25519.pub\n$ git commit -S -m "docs: add abstract"' },
        { id: 'e6-c2', type: 'callout', kind: 'info', title: 'Concept only', html: 'The simulator does not sign commits, so you only read about it here. Signing is rarely needed for coursework. It matters when the repository holds something where a fake author would be a problem, and a ruleset can then require signed commits. You can reuse the SSH key you already have, but add it to GitHub a second time with the type Signing Key.' },
        { id: 'e6-q3', type: 'question', q: 'e6-q-signed' }
      ] },
      { id: 'e6-owners', title: 'CODEOWNERS and how many repositories', blocks: [
        { id: 'e6-t5', type: 'text', html: '<p>With a large project, not every reviewer should check everything. A <dfn data-term="wfowners">CODEOWNERS</dfn> file says who must review which files. It lives in <code>.github/CODEOWNERS</code>:</p>' },
        { id: 'e6-code3', type: 'code', lang: 'text', title: '.github/CODEOWNERS', code: '# The supervisor reviews everything by default\n*                @teacher\n# The data steward checks anything about data\n/data-plan.md    @it-admin\n# Course material: the whole teaching team\n/slides/         @hamk-projects/teaching-team' },
        { id: 'e6-t6', type: 'text', html: '<p>The <b>last matching line wins</b>. Owners can be people or teams (<code>@org/team</code>), and the owner needs at least Write access to the repository. In a ruleset, open <b>Require a pull request before merging</b>, switch on <b>Require review from Code Owners</b> and a pull request cannot be merged until an owner approves.</p>' },        { id: 'e6-q4', type: 'question', q: 'e6-q-owners' },
        { id: 'e6-h1', type: 'h', text: 'One repository or many?' },
        { id: 'e6-tbl2', type: 'table', head: ['', 'Monorepo (one repository)', 'Many repositories'],
          rows: [['Example', 'All of a course in one place: slides, exercises, solutions', 'One repository per student thesis'],
                 ['Strength', 'One history, easy to change things together', 'Separate access, separate hand-over, easy to archive one'],
                 ['Weakness', 'Everyone sees everything; one set of permissions', 'Shared material has to be copied or referenced']] },
        { id: 'e6-c3', type: 'callout', kind: 'school', title: 'Rule of thumb for the school', html: 'Permissions belong to a repository. If two groups of people must see different things, they need different repositories. <b>One repository per thesis or student project</b> (created from a template) keeps hand-over and archiving simple. Share course material in a repository everyone can read.' },
        { id: 'e6-q5', type: 'question', q: 'e6-q-repos' }
      ] },
      { id: 'e6-cap1', title: 'Capstone part 1: set up the thesis repository', blocks: [
        { id: 'e6-t7', type: 'text', html: '<p>Now put it together. Supervisor <b>teacher</b> sets up a thesis repository for student <b>aino</b>. A ready-made template, <code>thesis-template</code>, already exists in the organization. You are signed in as <b>teacher</b>, an organization owner.</p>' },
        { id: 'e6-list1', type: 'list', ordered: true, steps: [
          'Create the repository from the template: <b>+ → New repository</b>, choose the template, owner <b>hamk-projects</b>, name it <code>thesis-aino</code>, keep it <b>Private</b>.',
          'Give Aino access: <b>Settings → Collaborators and teams → Add people</b>, role <b>Write</b>. (On a large course you would add a team instead.)',
          'Protect main: <b>Settings → Rules → Rulesets → New ruleset</b>, target the default branch, require a pull request with 1 approval.',
          'Open the first issue, <em>Write chapter 1</em>, so the work has a visible to-do list.'
        ] },
        { id: 'e6-c4', type: 'callout', kind: 'info', title: 'Simulator limit', html: 'The practice site cannot create milestones (such as "Draft 1"). On github.com you would add them under <b>Issues → Milestones</b> and group the thesis issues under them.' },        { id: 'e6-gh1', type: 'interactive', widget: 'github', title: 'Set up the thesis repository from a template',
          caption: 'Switch persona with the "Practise as" buttons if you want to see what Aino sees. Do the four tasks as teacher.',
          config: {
            start: '/' + ORG, personas: ['teacher', 'aino'], terminal: false,
            world: { me: 'teacher', myName: 'Tiina Teacher', users: USERS, orgs: ORGS,
              remotes: (function () { var r = {}; r[TPL] = { template: true, visibility: 'private', description: 'Thesis template: chapters, figures, README, .gitignore', commits: [
                { msg: 'Initial commit', author: 'teacher', files: { 'README.md': '# Thesis title\n\nStudent: \nSupervisor: \n', '.gitignore': 'data/\n*.zip\n', 'chapters/01-intro.md': '# Introduction\n' } }] }; return r; })() },
            tasks: [
              { id: 'create', text: 'Create <code>thesis-aino</code> in <b>hamk-projects</b> <b>from the template</b> (<b>+ → New repository</b>)',
                check: function (w) { var r = made(w); return !!r && r.name === 'thesis-aino' && /01-intro/.test(Object.keys(w.commit(r.refs[r.defaultBranch]).tree).join()); },
                hint: 'On the New repository page, open the template drop-down first.', solution: 'UI: + → New repository → Repository template: hamk-projects/thesis-template, Owner hamk-projects, name thesis-aino, Private → Create repository.' },
              { id: 'access', text: 'Give <b>aino</b> the <b>Write</b> role on the new repository',
                check: function (w) { var r = made(w); return !!r && ROLE_RANK[w.roleOf('aino', r.slug)] >= 3; },
                hint: 'Settings → Collaborators and teams → Add people.', solution: 'UI: Settings → Collaborators and teams → Add people → aino → Write.' },
              { id: 'rule', text: 'Add an <b>active</b> ruleset on the default branch that requires a <b>pull request with at least 1 approval</b>',
                check: function (w) { var r = made(w); return !!r && r.rules.some(function (x) { return x.enforcement !== 'disabled' && x.requirePR && x.approvals >= 1; }); },
                hint: 'Settings → Rules → Rulesets → New ruleset.', solution: 'UI: Settings → Rules → Rulesets → New ruleset → name "Protect main", Active, target default branch, tick Require a pull request before merging, approvals 1 → Create.' },
              { id: 'issue', text: 'Open an issue titled <em>Write chapter 1</em>',
                check: function (w) { var r = made(w); return !!r && r.issues.some(function (i) { return /chapter 1/i.test(i.title); }); },
                hint: 'Issues tab → New issue.', solution: 'UI: Issues → New issue → title "Write chapter 1" → Submit new issue.' }
            ] } },
        { id: 'e6-q6', type: 'question', q: 'e6-q-order' }
      ] },
      { id: 'e6-cap2', title: 'Capstone part 2: one change, start to finish', blocks: [
        { id: 'e6-t8', type: 'text', html: '<p>The repository now exists and is protected. Here Aino writes chapter 1 and the supervisor reviews it. This is the daily loop of GitHub flow, and it uses <b>both</b> tools: the terminal on your computer and the website. Use <b>Practise as</b> to switch between <b>aino</b> and <b>teacher</b>. The Git Bash window below always belongs to the person you are practising as, and it shares the same GitHub.</p>' },
        { id: 'e6-code4', type: 'code', lang: 'bash', title: 'Aino on her computer', code: '$ git clone https://github.com/hamk-projects/thesis-aino.git\n$ cd thesis-aino\n$ git switch -c chapter-1\n$ echo "Version control keeps every draft safe." >> chapters/01-intro.md\n$ git add chapters/01-intro.md\n$ git commit -m "feat(chapter-1): write introduction"\n$ git push -u origin chapter-1' },
        { id: 'e6-c5', type: 'callout', kind: 'tip', title: 'Try the wall first', html: 'Before the branch, run <code>git push origin main</code> from a commit on main. The ruleset stops it: changes to main must come through a pull request. That is the rule working as designed, not an error to fight.' },
        { id: 'e6-gh2', type: 'interactive', widget: 'github', title: 'Branch, push, pull request, review, merge, release, archive',
          caption: 'Start as aino. Issue #1 asks for chapter 1. The ruleset on main needs one approval from someone other than the author.',
          config: {
            start: '/' + THESIS, personas: ['aino', 'teacher', 'ben'], terminal: true,
            world: { me: 'aino', myName: 'Aino Student', config: { 'user.name': 'Aino Student', 'user.email': 'aino@example.com', 'init.defaultBranch': 'main' }, users: USERS, orgs: ORGS,
              remotes: (function () { var r = {}; r[THESIS] = { visibility: 'private', description: 'Bachelor thesis: version control at HAMK', collaborators: { aino: 'write' },
                commits: [{ msg: 'Initial commit', author: 'teacher', files: { 'README.md': '# Thesis: Aino Student\n\nSupervisor: @teacher\n', '.gitignore': 'data/\n*.zip\n', 'chapters/01-intro.md': '# Introduction\n' } }],
                rules: [{ name: 'Protect main', enforcement: 'active', target: '~DEFAULT_BRANCH', requirePR: true, approvals: 1, blockForce: true, blockDelete: true, bypass: [] }],
                issues: [{ title: 'Write chapter 1', body: 'Draft the introduction.', author: 'teacher', labels: ['documentation'], assignees: ['aino'] }] }; return r; })() },
            tasks: [
              { id: 'clone', text: 'As <b>aino</b>, clone the repository in the terminal', check: function (w) { var r = w.repo('~/thesis-aino'); return !!r && !!r.remotes.origin; },
                hint: 'Copy the HTTPS URL from the green Code button.', solution: 'git clone https://github.com/hamk-projects/thesis-aino.git' },
              { id: 'push', text: 'Create a branch, commit a change to <code>chapters/01-intro.md</code> and <b>push the branch</b> (not main)',
                check: function (w) { var r = w.server.repos[THESIS], b = Object.keys(r.refs).filter(function (k) { return k !== 'main'; })[0]; return !!b && !!w.commit(r.refs[b]) && w.commit(r.refs[b]).tree['chapters/01-intro.md'] !== w.commit(r.refs.main).tree['chapters/01-intro.md']; },
                hint: 'git switch -c, edit with echo ... >> file, git add, git commit, git push -u origin <branch>.',
                solution: 'cd thesis-aino\ngit switch -c chapter-1\necho "Version control keeps every draft safe." >> chapters/01-intro.md\ngit add chapters/01-intro.md\ngit commit -m "feat(chapter-1): write introduction"\ngit push -u origin chapter-1' },
              { id: 'pr', text: 'Open a <b>pull request</b> from your branch into main that says <code>Fixes #1</code> in the description',
                check: function (w) { var p = pull(w); return !!p && p.author === 'aino' && p.head !== 'main' && /(fix|close|resolve)\w* #1\b/i.test(p.body + ' ' + p.title); },
                hint: 'The yellow banner on the repository page offers Compare & pull request.', solution: 'UI: Compare & pull request → description "Fixes #1" → Create pull request.' },
              { id: 'review', text: 'Switch to <b>teacher</b> and <b>approve</b> the pull request (<b>Files changed → Review changes</b>)',
                check: function (w) { var p = pull(w); return !!p && p.reviews.some(function (rv) { return rv.state === 'approved' && rv.user === 'teacher'; }); },
                hint: 'Aino cannot approve her own pull request.', solution: 'UI: Practise as teacher → Pull requests → open it → Files changed → Review changes → Approve → Submit review.' },
              { id: 'merge', text: '<b>Merge</b> the pull request, then check that issue #1 closed on its own',
                check: function (w) { var p = pull(w), r = w.server.repos[THESIS]; return !!p && p.state === 'merged' && r.issues[0].state === 'closed'; },
                hint: 'The merge button turns green only after the approval.', solution: 'UI: Merge pull request → Confirm merge.' },
              { id: 'pull', text: 'As <b>aino</b>, update your computer: <code>git switch main</code> and <code>git pull</code>',
                check: function (w) { var r = w.repo('~/thesis-aino'), s = w.server.repos[THESIS]; return !!r && !!pull(w) && pull(w).state === 'merged' && r.heads.main === s.refs.main; },
                hint: 'Your local main is still the old one until you pull.', solution: 'git switch main\ngit pull' },
              { id: 'release', text: 'As <b>teacher</b>, publish a release tagged <code>v1.0</code> (<b>Releases → Draft a new release</b>)',
                check: function (w) { var r = w.server.repos[THESIS]; return r.releases.some(function (x) { return x.tag === 'v1.0'; }); },
                hint: 'Create the new tag in the release form.', solution: 'UI: Releases → Draft a new release → tag v1.0 → title "Final thesis" → Publish release.' },
              { id: 'archive', text: 'As <b>teacher</b>, <b>archive</b> the repository (<b>Settings → Danger Zone</b>)',
                check: function (w) { return !!w.server.repos[THESIS].archived; },
                hint: 'Danger Zone is at the bottom of Settings.', solution: 'UI: Settings → General → Danger Zone → Archive this repository.' }
            ] } },
        { id: 'e6-w2', type: 'callout', kind: 'warn', title: 'Common mistake', html: 'Archiving before the hand-in is accepted. An archived repository is read-only: nobody can push, open issues or merge until an admin unarchives it. Archive when the work is truly finished: the thesis then stays safe and read-only in the organization after Aino leaves.' },
        { id: 'e6-c6', type: 'callout', kind: 'info', title: 'Simulator simplifications', html: 'The terminal here understands <code>echo "text" &gt;&gt; file</code> instead of a real editor, and the website shows one pull request at a time in a simplified layout. The commands and the rules (approval needed, nobody pushes to main) are the real ones.' },
        { id: 'e6-q7', type: 'question', q: 'e6-q-pr-self' }
      ] },
      { id: 'e6-summary', title: 'Summary', blocks: [
        { id: 'e6-sum', type: 'list', items: [
          '<b>GitHub flow</b> (branch, pull request, review, merge) fits nearly every school project; Git flow and trunk-based suit bigger, release-driven or highly automated teams.',
          '<b>Conventional commits</b> (<code>feat(scope): description</code>) keep history readable. <b>Signed commits</b> prove who made a commit (the badge says Verified).',
          '<b>CODEOWNERS</b> sends reviews to the right people; the last matching line wins. Use one repository per thesis or project so permissions and hand-over stay simple.',
          'Capstone: create from template, add people, protect main with a ruleset, track work in issues, change via branch and pull request, approve, merge, release, archive.'
        ] }
      ] }
    ],
    questions: [
      { id: 'e6-q-flow', type: 'mc', prompt: 'Six students write one report together and hand it in once, at the end of the term. Which workflow fits best?',
        options: ['Git flow with develop, release and hotfix branches', 'GitHub flow: short branches and pull requests into main', 'Everyone commits directly to main with no branches'],
        answer: 1, hints: ['Which one needs the fewest rules to remember and still has reviews?'], explain: 'GitHub flow is simple and keeps main safe. Git flow is for versioned releases, and direct commits to main skip the review the school wants.' },
      { id: 'e6-q-conv', type: 'mc', prompt: 'Which commit message follows the conventional commits style?',
        options: ['fixed stuff', 'fix(figures): correct axis label in figure 3', 'Updated the thesis again!!!'],
        answer: 1, hints: ['Look for type, optional scope in brackets, colon, short description.'], explain: 'It has a type (<code>fix</code>), a scope and a clear description of the change.' },
      { id: 'e6-q-signed', type: 'mc', prompt: 'What does a "Verified" badge on a commit tell you?',
        options: ['The text of the commit has no mistakes', 'The commit was signed with a key that belongs to the account shown as author', 'The commit was reviewed and approved'],
        answer: 1, explain: 'A signature proves who made the commit. It says nothing about quality or review; that is what pull request approvals are for.' },
      { id: 'e6-q-owners', type: 'mc', prompt: 'CODEOWNERS contains <code>/slides/ @hamk-projects/teaching-team</code>. A pull request changes only <code>slides/week1.md</code> and the ruleset requires code owner review. Who must approve?',
        options: ['Any one member of the teaching-team team', 'Only the organization owner', 'Nobody, CODEOWNERS only suggests reviewers'],
        answer: 0, hints: ['The rule is "required" once the ruleset switches it on.'], explain: 'With code owner review required, an approval from an owner (here, someone in that team) is needed before merging.' },      { id: 'e6-q-repos', type: 'mc', prompt: 'Each student must see only their own thesis, and the school wants to archive each thesis separately. What is the best setup?',
        options: ['One repository with a folder per student', 'One repository per thesis, created from a template', 'One personal repository per student on their own account'],
        answer: 1, explain: 'Access and archiving work per repository. A personal repository would leave with the student, which the school wants to avoid.' },
      { id: 'e6-q-order', type: 'order', prompt: 'Put the capstone setup steps in the order of the exercise.',
        items: ['Create the repository from the template', 'Give the student the Write role', 'Add a ruleset that requires a reviewed pull request on main', 'Open the first issue'],
        explain: 'Create first. Then add people and protect main before any work starts, so nothing reaches main unreviewed.' },
      { id: 'e6-q-pr-self', type: 'multi', prompt: 'Aino opened a pull request, and main requires 1 approval. Who can give a counting approval?',
        options: ['teacher, who has admin rights', 'Aino herself', 'Ben, if he has Write access to the repository', 'Ben, with only Read access'],
        answer: [0, 2], explain: 'Approvals count when they come from someone with write access who is not the author. The author cannot approve their own pull request, and Read-only reviews do not count.' }
    ]
  });
})();
