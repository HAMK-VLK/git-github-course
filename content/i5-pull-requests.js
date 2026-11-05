/* i5 = 2.5 Pull requests and code review (github track). Two github.com simulators:
 * 1) Aino's pull request is reviewed and merged by the teacher; 2) Ben has only Read access and uses a fork. */
(function () {
  var SLUG = 'hamk-projects/thesis-aino', BR = 'methods-chapter', FILE = 'chapters/02-methods.md';
  var METHODS0 = '# Methods\n\nI interviewed teh teachers of three degree programmes.\n';
  var FSLUG = 'hamk-projects/web-dev-materials', FORK = 'ben/web-dev-materials';
  var USERS = { teacher: { name: 'Tiina Teacher' }, ben: { name: 'Ben Opiskelija' } };
  function pull(w, slug, pred) { var r = w.server.repos[slug]; return r ? r.pulls.filter(pred)[0] : null; }
  function aPr(w) { return pull(w, SLUG, function (p) { return p.head === BR; }); }
  function reviewBy(w, who, state) { var p = aPr(w); return !!p && p.reviews.some(function (r) { return r.user === who && r.state === state; }); }

  var WORLD_A = {
    me: 'aino', myName: 'Aino Student', config: { 'user.name': 'Aino Student', 'user.email': 'aino@example.com' },
    users: USERS,
    orgs: { 'hamk-projects': { displayName: 'HAMK Projects', owners: ['teacher'], members: ['aino', 'ben'], settings: { basePermission: 'read' },
      teams: { 'thesis-2026': { name: 'Thesis 2026', members: ['aino'], repos: { 'hamk-projects/thesis-aino': 'write' } } } } },
    remotes: { 'hamk-projects/thesis-aino': {
      description: 'Bachelor thesis: version control at HAMK',
      commits: [
        { msg: 'Initial commit', author: 'teacher', files: { 'README.md': '# Thesis: Aino Student\n\nSupervisor: @teacher\n' } },
        { msg: 'Add chapter 1 draft', author: 'aino', files: { 'chapters/01-intro.md': '# Introduction\n\nVersion control keeps...\n' } }],
      branches: { 'methods-chapter': [{ msg: 'Add methods chapter', author: 'aino', files: { 'chapters/02-methods.md': METHODS0 } }] },
      rules: [{ name: 'Protect main', target: '~DEFAULT_BRANCH', requirePR: true, approvals: 1, blockForce: true, blockDelete: true, bypass: [] }] } },
    run: []
  };
  var WORLD_B = {
    me: 'ben', myName: 'Ben Opiskelija', config: { 'user.name': 'Ben Opiskelija', 'user.email': 'ben@example.com' },
    users: USERS,
    orgs: { 'hamk-projects': { displayName: 'HAMK Projects', owners: ['teacher'], members: ['ben'], settings: { basePermission: 'read' }, teams: {} } },
    remotes: { 'hamk-projects/web-dev-materials': {
      visibility: 'public', description: 'Course material: Web development 1',
      commits: [
        { msg: 'Initial commit', author: 'teacher', files: { 'README.md': '# Web development 1\n\nWeekly exercises.\n' } },
        { msg: 'Add week 1 exercise', author: 'teacher', files: { 'week-1.md': '# Week 1\n\nBuild a page with a headng and a list.\n' } }] } },
    run: []
  };

  TDC.registerTopic({
    id: 'i5',
    title: 'Pull requests and code review',
    subtitle: 'Propose a change, let someone review it, and merge it: the normal way to get work into a protected main branch, with a fork when you may not write.',
    audience: 'everyone who shares a repository · after lessons 1.8 and 2.2',
    objectives: [
      'open a pull request from a branch and describe it so a reviewer understands it',
      'request a reviewer and review a pull request: Comment, Approve or Request changes',
      'read the Files changed tab and update a pull request with new commits',
      'merge a pull request with a merge commit, squash or rebase, and delete the branch afterwards',
      'fork a repository and open a pull request when you have no write access'
    ],
    glossary: {
      pullrequest: { term: 'pull request', def: 'A request to merge one branch into another. It shows the changes, holds the discussion and the reviews, and is the place where the merge happens. Often shortened to PR.' },
      review: { term: 'review', def: 'A reviewer’s answer on a pull request: Comment, Approve or Request changes.' },
      fork: { term: 'fork', def: 'Your own copy of someone else’s repository on GitHub. You can change it freely and then ask the original owners to take your changes with a pull request.' }
    },
    commands: [
      { cmd: 'git push -u origin <branch>', does: 'Send your branch to GitHub; GitHub then offers "Compare & pull request"' },
      { cmd: 'git switch <branch>', does: 'Go back to the PR branch to add fixes after a review' },
      { cmd: 'git push', does: 'Send more commits: the open pull request updates by itself' }
    ],
    sections: [
      { id: 'i5-why', title: 'What a pull request is', blocks: [
        { id: 'i5-why-t', type: 'text', html: '<p>A <dfn data-term="pullrequest">pull request</dfn> (PR) says: "I did some work on this <dfn data-term="branch">branch</dfn>. Please look at it and, if it is good, <dfn data-term="merge">merge</dfn> it into <code>main</code>." The name is odd; read it as <b>merge request</b>.</p><p>A PR gives you three things in one place: the <b>changes</b> (what is different), the <b>discussion</b> (comments and reviews) and the <b>merge button</b>. Nothing reaches <code>main</code> until someone agrees.</p>' },
        { id: 'i5-why-tbl', type: 'table', head: ['Step', 'Who', 'Where'], rows: [
          ['1. Make a branch and commit', 'Author', 'Your computer or the browser'],
          ['2. Push the branch', 'Author', 'Terminal, GitHub Desktop, or automatic in the browser'],
          ['3. Open the pull request', 'Author', 'github.com'],
          ['4. Review: comment, approve, request changes', 'Reviewer', 'github.com'],
          ['5. Fix and push again', 'Author', 'Same branch'],
          ['6. Merge and delete the branch', 'Someone with Write access', 'github.com']
        ], compact: true, caption: 'The life of a pull request.' },
        { id: 'i5-why-c', type: 'callout', kind: 'school', title: 'Why the school likes this', html: 'In the school’s organization the <code>main</code> branch of a thesis or course repository is usually protected: <b>nobody pushes straight to it</b>, not even you. Everything goes through a pull request with at least one approval. The supervisor sees every change, and the history stays tidy (lesson 3.4 shows how to set this up).' },
        { id: 'i5-q-what-blk', type: 'question', q: 'i5-q-what' }
      ] },
      { id: 'i5-open', title: 'Open a pull request', blocks: [
        { id: 'i5-open-t', type: 'text', html: '<p>You are <b>aino</b>. On the branch <code>methods-chapter</code> you wrote the first version of your methods chapter. It is already pushed. Now you ask your supervisor to review it.</p>' },
        { id: 'i5-open-tabs', type: 'tabs', group: 'tool', tabs: [
          { label: 'Terminal', blocks: [
            { id: 'i5-open-term', type: 'code', lang: 'bash', code: '$ git switch -c methods-chapter\n$ git add chapters/02-methods.md\n$ git commit -m "Add methods chapter"\n$ git push -u origin methods-chapter\nremote: Create a pull request for \'methods-chapter\' on GitHub by visiting:\nremote:      https://github.com/hamk-projects/thesis-aino/pull/new/methods-chapter' }
          ] },
          { label: 'GitHub Desktop', blocks: [
            { id: 'i5-open-gd', type: 'text', html: '<p>Commit on your branch, click <b>Publish branch</b> (or <b>Push origin</b>), then <b>Preview Pull Request</b> to check the changes, then <b>Create Pull Request</b>. Desktop opens the pull request page in your browser.</p>' }
          ] },
          { label: 'GitHub website', blocks: [
            { id: 'i5-open-web', type: 'list', steps: true, items: [
              'Open the repository. After a recent push a yellow banner offers <b>Compare &amp; pull request</b>: click it.',              'Otherwise open the <b>Pull requests</b> tab, click <b>New pull request</b>, and choose <b>base: main</b> and <b>compare: methods-chapter</b>.',
              'Write a <b>title</b> and a <b>description</b>, then click <b>Create pull request</b>.'
            ] }
          ] }
        ] },
        { id: 'i5-open-h', type: 'h', text: 'Base and compare' },
        { id: 'i5-open-bc', type: 'text', html: '<p><b>base</b> is where the changes should go (usually <code>main</code>). <b>compare</b> is the branch that has the new work. The arrow always points from compare into base. Below the form GitHub lists the commits and shows every changed line, so look at it before you click.</p>' },
        { id: 'i5-open-good', type: 'callout', kind: 'tip', title: 'A good description answers three questions', html: '<b>What</b> changed, <b>why</b>, and <b>what should the reviewer look at</b>. For example: "Adds the methods chapter (first draft). Please check the interview method in section 2.1. Not finished: the survey part."' },
        { id: 'i5-open-sim', type: 'interactive', widget: 'github', title: 'Open a pull request and ask for a review',
          caption: 'You start as <b>aino</b>. Use the <b>Pull requests</b> tab, or the <b>compare</b> page. In the next steps you will switch to <b>teacher</b> with the <b>Practise as</b> buttons.',
          config: {
            start: '/' + SLUG, personas: ['aino', 'teacher'], terminal: false, world: WORLD_A,
            tasks: [
              { id: 'open', text: 'As <b>aino</b>, open a pull request from <code>methods-chapter</code> into <code>main</code> with a title and a description',
                check: function (w) { return !!pull(w, SLUG, function (p) { return p.head === BR && p.author === 'aino' && p.base === 'main'; }); },
                hint: 'Pull requests tab, New pull request (or the compare page). Base is main, compare is methods-chapter.', solution: 'Pull requests → New pull request → base: main, compare: methods-chapter → write title and description → Create pull request' },
              { id: 'reviewer', text: 'In the right-hand column, request <b>teacher</b> as <b>Reviewers</b>',
                check: function (w) { var p = aPr(w); return !!p && (p.reviewers || []).indexOf('teacher') >= 0; },
                hint: 'The Reviewers box sits at the right of the pull request page.', solution: 'On the pull request page, Reviewers → tick teacher' },
              { id: 'files', text: 'Open the <b>Files changed</b> tab and see which lines you added',
                check: function (w) { return w.did('click', function (e) { return e.id === 'files-changed'; }); }, solution: 'Click "Files changed" under the title.' }
            ] } },
        { id: 'i5-q-bc-blk', type: 'question', q: 'i5-q-bc' }
      ] },
      { id: 'i5-review', title: 'Review: comment, approve, request changes', blocks: [
        { id: 'i5-rev-t', type: 'text', html: '<p>Reviewing is reading the changes and answering. On <b>Files changed</b> you see old and new text side by side (red lines removed, green lines added). Click <b>Review changes</b> and choose one of three answers:</p>' },
        { id: 'i5-rev-tbl', type: 'table', head: ['Choice', 'Meaning', 'Effect on merging'], rows: [
          ['<b>Comment</b>', 'General feedback, no decision', 'None'],
          ['<b>Approve</b>', '"This is good to merge."', 'Counts toward the required approvals'],
          ['<b>Request changes</b>', '"Fix this first."', 'Blocks the merge until you approve or someone dismisses your review']
        ], compact: true },
        { id: 'i5-rev-c', type: 'callout', kind: 'info', title: 'You cannot approve your own pull request', html: 'GitHub does not let the author approve or request changes on their own PR. Someone else must review. The author can still write comments. Only reviews from people with <b>Write</b> access or higher count toward the required approvals.' },        { id: 'i5-rev-h', type: 'h', text: 'Update the pull request' },
        { id: 'i5-rev-up', type: 'text', html: '<p>To answer a review, <b>do not open a new PR</b>. Add commits to the <em>same branch</em> and push. The open PR updates by itself, and reviewers can see the new commits. In the browser you can edit the file on that branch and commit to it directly.</p>' },
        { id: 'i5-rev-c2', type: 'callout', kind: 'warn', title: 'Common mistake: a new PR for every fix', html: 'One topic, one branch, one pull request. If you open a second PR for the fix, the reviewer must start again and the discussion is split in two.' },
        { id: 'i5-q-update-blk', type: 'question', q: 'i5-q-update' },
        { id: 'i5-rev-sim', type: 'interactive', widget: 'github', title: 'Request changes, fix, approve',
          caption: 'The pull request is already open and Aino has asked for a review. Play both roles: start as <b>teacher</b>, then <b>aino</b>, then <b>teacher</b> again. The sample file has a typo ("teh").',
          config: {
            start: '/' + SLUG + '/pull/1', personas: ['teacher', 'aino'], terminal: false,
            world: Object.assign({}, WORLD_A, { me: 'teacher', myName: 'Tiina Teacher', remotes: { 'hamk-projects/thesis-aino': Object.assign({}, WORLD_A.remotes[SLUG], {
              pulls: [{ title: 'Add methods chapter', head: BR, author: 'aino', body: 'First draft of the methods chapter. Please check section 2.1.' }] }) } }),
            tasks: [
              { id: 'changes', text: 'As <b>teacher</b>: open <b>Files changed</b> and submit a review with <b>Request changes</b>',
                check: function (w) { return reviewBy(w, 'teacher', 'changes') || reviewBy(w, 'teacher', 'approved'); },
                hint: 'Files changed → Review changes → Request changes → write what to fix → Submit review.', solution: 'Files changed → Review changes ▾ → Request changes → comment → Submit review' },
              { id: 'blocked', text: 'Look at the merge box on the Conversation tab: why can the PR not be merged yet?',
                check: function (w) { return w.did('visit', function (e) { return /\/pull\/\d+$/.test(e.path); }) && (reviewBy(w, 'teacher', 'changes') || reviewBy(w, 'teacher', 'approved')); },
                hint: 'Open the Conversation tab after your review.' },
              { id: 'fix', text: 'As <b>aino</b>: fix the typo "teh" in <code>chapters/02-methods.md</code> and commit it <b>to the branch methods-chapter</b>',
                check: function (w) { var r = w.server.repos[SLUG], c = w.commit(r.refs[BR]); return !!c && c.tree[FILE] !== METHODS0 && !/\bteh\b/.test(c.tree[FILE]); },
                hint: 'Switch persona to aino, choose the branch methods-chapter, open the file, click the pencil, commit directly to methods-chapter.', solution: 'Branch: methods-chapter → chapters/02-methods.md → ✎ → change "teh" to "the" → Commit changes… → commit directly to methods-chapter' },
              { id: 'approve', text: 'As <b>teacher</b>: approve the updated pull request',
                check: function (w) { return reviewBy(w, 'teacher', 'approved'); },
                hint: 'Switch back to teacher. A new review replaces your earlier one.', solution: 'Files changed → Review changes ▾ → Approve → Submit review' }
            ] } }
      ] },
      { id: 'i5-merge', title: 'Merge and clean up', blocks: [
        { id: 'i5-mg-t', type: 'text', html: '<p>When the required approvals are in and no checks fail, the green button becomes active. Its arrow offers three ways to merge:</p>' },
        { id: 'i5-mg-tbl', type: 'table', head: ['Method', 'What lands on main', 'Use it when'], rows: [
          ['<b>Create a merge commit</b>', 'All commits of the branch plus one merge commit', 'You want the full story kept as it happened'],
          ['<b>Squash and merge</b>', 'One new commit with all changes together', 'The branch has messy commits ("fix", "fix 2")'],
          ['<b>Rebase and merge</b>', 'The branch commits replayed one by one, no merge commit', 'You want a straight line of history']
        ], compact: true, caption: 'Repository owners may switch some methods off, so you may see fewer options.' },
        { id: 'i5-mg-after', type: 'text', html: '<p>After the merge GitHub offers <b>Delete branch</b>. Click it: the branch has done its job, and the PR page keeps the full history. If you ever need the branch again, there is a <b>Restore branch</b> button.</p>' },        { id: 'i5-mg-c', type: 'callout', kind: 'tip', title: 'Draft pull requests', html: 'Not ready yet? Choose <b>Create draft pull request</b> instead. A draft cannot be merged. When you are done, click <b>Ready for review</b>.' },        { id: 'i5-mg-sim', type: 'interactive', widget: 'github', title: 'Merge the approved pull request and delete the branch',
          caption: 'You are the <b>teacher</b>. Aino’s pull request needs one approval first. Open it, approve, try the arrow next to the merge button, merge and clean up.',
          config: {
            start: '/' + SLUG + '/pull/1', personas: ['teacher', 'aino'], terminal: false,
            world: Object.assign({}, WORLD_A, { me: 'teacher', myName: 'Tiina Teacher', remotes: { 'hamk-projects/thesis-aino': Object.assign({}, WORLD_A.remotes[SLUG], {
              pulls: [{ title: 'Add methods chapter', head: BR, author: 'aino', body: 'First draft of the methods chapter. Please check section 2.1.' }] }) },
              run: [] }),
            tasks: [
              { id: 'approve', text: 'As <b>teacher</b>: approve the pull request (it needs 1 approval)',
                check: function (w) { return reviewBy(w, 'teacher', 'approved'); }, solution: 'Files changed → Review changes ▾ → Approve → Submit review' },
              { id: 'merge', text: 'Merge the pull request (try <b>Squash and merge</b>)',
                check: function (w) { var p = aPr(w); return !!p && p.state === 'merged'; }, hint: 'Use the arrow next to the green button to choose the method.', solution: 'Conversation → ▾ → Squash and merge → Confirm' },
              { id: 'main', text: 'Check: the file <code>chapters/02-methods.md</code> is now on <code>main</code>',
                check: function (w) { var r = w.server.repos[SLUG], c = w.commit(r.refs.main); return !!c && c.tree[FILE] != null; } },
              { id: 'delete', text: 'Click <b>Delete branch</b>',
                check: function (w) { return !w.server.repos[SLUG].refs[BR]; }, solution: 'On the merged pull request, click Delete branch.' }
            ] } },
        { id: 'i5-q-squash-blk', type: 'question', q: 'i5-q-squash' }
      ] },
      { id: 'i5-fork', title: 'Fork: when you may not write', blocks: [
        { id: 'i5-fk-t', type: 'text', html: '<p>Ben is a student with only <b>Read</b> access to the teacher’s course repository <code>web-dev-materials</code>. He found a typo ("headng") and cannot push a branch there. The answer is a <dfn data-term="fork">fork</dfn>: his own copy under <code>ben/web-dev-materials</code>, where he can do anything.</p>' },
        { id: 'i5-fk-steps', type: 'list', steps: true, items: [
          'On the original repository click <b>Fork</b>, then <b>Create fork</b>.',
          'In <em>your</em> fork fix the file and commit it (to a new branch or to main of the fork).',
          'Open a pull request: base is the original repository’s <code>main</code>, compare is your fork’s branch.',
          'The maintainers review and merge it. You never needed access to the original.'
        ] },
        { id: 'i5-fk-c', type: 'callout', kind: 'school', title: 'Fork or branch?', html: 'If you have <b>Write</b> access (a team member, a collaborator), use a normal branch in the same repository: simpler. Fork when you do not. In an organization, forking <em>private</em> repositories can be switched off by the owners (the simulator shows the message).' },        { id: 'i5-fk-sim', type: 'interactive', widget: 'github', title: 'Fork, fix and propose',
          caption: 'You are <b>ben</b>. After the fork, edit <code>week-1.md</code> in <em>your</em> fork, then open the pull request. Finally switch to <b>teacher</b> to merge it.',
          config: {
            start: '/' + FSLUG, personas: ['ben', 'teacher'], terminal: false, world: WORLD_B,
            tasks: [
              { id: 'fork', text: 'As <b>ben</b>, fork the repository',
                check: function (w) { return !!w.server.repos[FORK]; }, hint: 'The Fork button is at the top right of the repository page.', solution: 'Fork → Create fork' },
              { id: 'fix', text: 'In <code>' + FORK + '</code>, fix "headng" and commit the change',
                check: function (w) { var f = w.server.repos[FORK]; if (!f) return false; return Object.keys(f.refs).some(function (b) { var c = w.commit(f.refs[b]); return c && c.tree['week-1.md'] && !/headng/.test(c.tree['week-1.md']); }); },
                hint: 'Open the fork, then week-1.md, the pencil, and commit. A new branch such as ben-patch-1 is fine.', solution: 'Fork → week-1.md → ✎ → fix the word → Commit changes… → Commit changes' },
              { id: 'pr', text: 'Open a pull request from your fork into <code>' + FSLUG + '</code>',
                check: function (w) { return !!pull(w, FSLUG, function (p) { return p.headRepo === FORK && p.author === 'ben'; }); },
                hint: 'Pull requests → New pull request, then choose your fork in the compare list. On the fork’s page the "Contribute" button also helps.', solution: 'Original repository → Pull requests → New pull request → compare: ben:<branch> → Create pull request' },
              { id: 'merge', text: 'Switch to <b>teacher</b> and merge Ben’s pull request',
                check: function (w) { var p = pull(w, FSLUG, function (x) { return x.headRepo === FORK; }); return !!p && p.state === 'merged' && p.mergedBy === 'teacher'; },
                solution: 'Practise as teacher → Pull requests → open it → Merge pull request → Confirm' }
            ] } },
        { id: 'i5-q-fork-blk', type: 'question', q: 'i5-q-fork' }
      ] },
      { id: 'i5-summary', title: 'Summary', blocks: [
        { id: 'i5-sum', type: 'list', items: [
          'A pull request proposes merging <b>compare</b> into <b>base</b> and holds changes, discussion and the merge button.',
          'Describe what, why and what to check. Ask for a reviewer.',
          'A review is Comment, Approve or Request changes. Authors cannot approve their own PR.',
          'Fix by pushing more commits to the same branch: the PR updates itself.',
          'Merge with a merge commit, squash or rebase, then delete the branch.',
          'No write access? Fork, change your copy, and open a PR from the fork.'
        ] }
      ] }
    ],
    questions: [
      { id: 'i5-q-what', type: 'mc', prompt: 'What does opening a pull request do?',
        options: ['Merges your branch into main immediately', 'Asks for your branch to be reviewed and merged, and shows the changes', 'Copies the repository to your account', 'Deletes your branch'], answer: 1, shuffle: false,
        hints: ['Nothing is merged until someone clicks the merge button.'], explain: 'A PR is a <b>request</b>. It changes nothing on <code>main</code> until it is merged; copying a repository is a fork.' },
      { id: 'i5-q-bc', type: 'mc', prompt: 'You want to merge <code>methods-chapter</code> into <code>main</code>. What do you choose?',
        options: ['base: methods-chapter, compare: main', 'base: main, compare: methods-chapter', 'base: main, compare: main'], answer: 1, shuffle: false,
        hints: ['Base is the branch that receives the changes.'], explain: '<b>base</b> receives, <b>compare</b> brings. Reversed, you would propose merging main into your branch.' },
      { id: 'i5-q-update', type: 'mc', prompt: 'The teacher requested changes on your PR. You fixed the text on your computer. What next?',
        options: ['Open a new pull request with the fix', 'Commit and push to the same branch; the PR updates by itself', 'Delete the PR and the branch'], answer: 1,
        hints: ['A PR follows its branch.'], explain: 'The PR always shows the current state of its branch. A second PR would split the discussion.' },
      { id: 'i5-q-review', type: 'match', prompt: 'Match the review choice to its meaning.',
        pairs: [['Comment', 'feedback without a decision'], ['Approve', 'ready to merge'], ['Request changes', 'blocks merging until fixed']], explain: 'Only <b>Approve</b> counts toward the required approvals; <b>Request changes</b> blocks until fixed.' },
      { id: 'i5-q-squash', type: 'mc', prompt: 'Aino’s branch has twelve commits such as "fix", "fix again", "typo". Which merge method gives <code>main</code> one tidy commit?',
        options: ['Create a merge commit', 'Squash and merge', 'Rebase and merge'], answer: 1, shuffle: false,
        explain: 'Squash combines all changes into <b>one</b> new commit. A merge commit keeps all twelve; rebase replays all twelve.' },
      { id: 'i5-q-fork', type: 'multi', prompt: 'Ben has only Read access to a repository. Which statements are true?',
        options: ['He can fork it and change his own copy', 'He can open a pull request from his fork to the original', 'He can push a branch straight to the original', 'He can merge his own pull request into the original'], answer: [0, 1],
        explain: 'Read access allows forking and proposing. Pushing branches and merging need Write.' }
    ]
  });
})();
