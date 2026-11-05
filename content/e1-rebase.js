/* e1 = 4.1 Rewriting history: rebase and cherry-pick. */
(function () {
  var cfg = { 'user.name': 'Aino Student', 'user.email': 'aino@example.com', 'init.defaultBranch': 'main' };
  var msgs = function (w, b) { var r = w.repo(); return r && r.heads[b || r.HEAD.branch] ? w.commitsOn(r, b).map(function (c) { return c.msg; }) : []; };
  var linear = function (w, b) { var r = w.repo(); return w.commitsOn(r, b).every(function (c) { return c.parents.length < 2; }); };

  TDC.registerTopic({
    id: 'e1',
    title: 'Rewriting history: rebase and cherry-pick',
    subtitle: 'Keep history in a straight line, copy one fix to another branch, and know when never to do either.',
    audience: 'experienced · you can branch, merge and push',
    objectives: [
      'explain the difference between merge and rebase',
      'rebase a feature branch onto main',
      'copy a single commit to another branch with cherry-pick',
      'keep your history linear with git pull --rebase',
      'state the golden rule of rebasing and read an interactive rebase to-do list'
    ],
    glossary: {
      rebase: { term: 'rebase', def: 'Replay your commits on top of another commit. The commits get new ids, so it rewrites history.' },
      cherrypick: { term: 'cherry-pick', def: 'Copy one commit from another branch onto the current branch as a new commit.' }
    },
    commands: [
      { cmd: 'git rebase <branch>', does: 'Replay the current branch\'s commits on top of <branch>' },
      { cmd: 'git cherry-pick <commit>', does: 'Copy one commit onto the current branch' },
      { cmd: 'git pull --rebase', does: 'Fetch, then replay your local commits on top of the remote ones' },
      { cmd: 'git rebase -i <base>', does: 'Edit, squash, reword or drop commits in a to-do list (real Git only)' },
      { cmd: 'git push --force-with-lease', does: 'Force-push, but only if nobody else pushed in the meantime' }
    ],
    sections: [
      { id: 'e1-why', title: 'Merge or rebase?', blocks: [
        { id: 'e1-t1', type: 'text', html: '<p>Two branches have gone their own way. A <b>merge</b> joins them with a new merge commit, so history shows what really happened: two lines that meet. A <dfn data-term="rebase">rebase</dfn> instead takes your commits and <b>replays</b> them on top of the other branch, as if you had started your work later. The result is one straight line.</p>' },
        { id: 'e1-fig', type: 'figure', alt: 'Before: feature commit F branches off an older commit. After rebase: F′ sits after the newest main commit.', caption: 'Rebase moves your commit F after the newest commit on main. F becomes F′, a new commit.',
          svg: '<svg viewBox="0 0 340 100" width="100%" role="img" fill="currentColor" stroke="currentColor" stroke-width="2" font-size="12" text-anchor="middle"><path d="M20 30H100M60 30L100 75" fill="none"/><path d="M200 30H320" fill="none"/><circle cx="20" cy="30" r="7"/><circle cx="60" cy="30" r="7"/><circle cx="100" cy="30" r="7"/><circle cx="100" cy="75" r="7"/><circle cx="200" cy="30" r="7"/><circle cx="240" cy="30" r="7"/><circle cx="280" cy="30" r="7"/><circle cx="320" cy="30" r="7"/><g stroke="none"><text x="100" y="16">main</text><text x="100" y="97">F</text><text x="280" y="16">main</text><text x="320" y="16">F′</text><text x="150" y="34">→</text></g></svg>' },
        { id: 'e1-tab', type: 'table', head: ['', 'Merge', 'Rebase'], rows: [
          ['History', 'Shows the real branching', 'One straight line'],
          ['Commits', 'Kept as they are, plus a merge commit', 'Copied: new ids, old ones abandoned'],
          ['Safe on shared branches', 'Yes', '<b>No</b> (see the golden rule)'],
          ['Conflicts', 'Solved once', 'Possibly once per replayed commit']
        ] },
        { id: 'e1-c1', type: 'callout', kind: 'warn', title: 'The golden rule', html: 'Never rebase commits that other people already have (anything you pushed and a teammate pulled). Rebasing creates new commits; teammates still hold the old ones and Git then sees two versions of the same work.' },
        { id: 'e1-qb', type: 'question', q: 'e1-q-rule' }
      ] },
      { id: 'e1-rebase', title: 'Rebase a branch onto main', blocks: [
        { id: 'e1-t2', type: 'text', html: '<p>You are on <code>feature</code>. Meanwhile <code>main</code> got a new commit. Run <code>git rebase main</code> from <code>feature</code>: Git sets your commits aside, moves to the tip of <code>main</code> and replays them one by one. Afterwards <code>main</code> can fast-forward to <code>feature</code> with a plain <code>git merge</code>, with no merge commit.</p>' },
        { id: 'e1-sim1', type: 'interactive', widget: 'terminal', title: 'Rebase feature onto main',
          caption: 'Check the graph before and after: <code>git log --oneline --graph --all</code>.',
          config: {
            world: { config: cfg, cwd: '~/site', files: { '~/site/index.md': '# Site\n' },
              run: ['git init', 'git add .', 'git commit -m "Start site"', 'git switch -c feature', 'echo "Contact page" > contact.md', 'git add .', 'git commit -m "Add contact page"', 'git switch main', 'echo "News" > news.md', 'git add .', 'git commit -m "Add news page"', 'git switch feature'] },
            panels: ['graph'],
            tasks: [
              { id: 'rebase', text: 'On <code>feature</code>, rebase onto <code>main</code>', check: function (w) { var m = msgs(w, 'feature'); return m.indexOf('Add news page') >= 0 && m[0] === 'Add contact page' && linear(w, 'feature'); }, hint: 'Which branch do you want to sit on top of?', solution: 'git rebase main' },
              { id: 'ff', text: 'Switch to <code>main</code> and fast-forward it: <code>git merge feature</code>', check: function (w) { return msgs(w, 'main')[0] === 'Add contact page' && linear(w, 'main'); }, solution: 'git switch main\ngit merge feature' }
            ] } },
        { id: 'e1-c2', type: 'callout', kind: 'info', title: 'Conflicts', html: 'In real Git a conflict during rebase stops it: fix the file, <code>git add</code> it, then <code>git rebase --continue</code> (or <code>git rebase --abort</code> to go back). This simulator rolls back any rebase that conflicts.' },
        { id: 'e1-qc', type: 'question', q: 'e1-q-newids' }
      ] },
      { id: 'e1-pick', title: 'Cherry-pick one commit', blocks: [
        { id: 'e1-t3', type: 'text', html: '<p><dfn data-term="cherrypick">Cherry-pick</dfn> copies a single commit onto your current branch. Typical case: a bug fix landed on <code>main</code>, but the already-published <code>release</code> branch needs it too, without all the new features.</p>' },
        { id: 'e1-sim2', type: 'interactive', widget: 'terminal', title: 'Copy a hotfix to the release branch',
          caption: 'The fix is the newest commit on <code>main</code>. Find it with <code>git log --oneline main</code>.',
          config: {
            world: { config: cfg, cwd: '~/site', files: { '~/site/index.md': '# Site\n', '~/site/about.md': 'Abuot us\n' },
              run: ['git init', 'git add .', 'git commit -m "Version 1"', 'git branch release', 'echo "Search" > search.md', 'git add .', 'git commit -m "Add search"', 'echo "About us" > about.md', 'git add .', 'git commit -m "Fix typo on about page"'] },
            panels: ['graph'],
            tasks: [
              { id: 'switch', text: 'Switch to <code>release</code>', check: function (w) { return w.repo().HEAD.branch === 'release' || msgs(w, 'release').indexOf('Fix typo on about page') >= 0; }, solution: 'git switch release' },
              { id: 'pick', text: 'Cherry-pick the typo fix onto <code>release</code> (not the search feature)', check: function (w) { var m = msgs(w, 'release'); return m.indexOf('Fix typo on about page') >= 0 && m.indexOf('Add search') < 0; }, hint: 'You can give a commit id from the log, or a branch name for its newest commit.', solution: 'git cherry-pick main' }
            ] } },
        { id: 'e1-c3', type: 'callout', kind: 'tip', html: 'The copy gets a new id, so the same change now exists twice. Cherry-pick for rare rescues; for normal work, merge.' },
        { id: 'e1-qd', type: 'question', q: 'e1-q-pick' }
      ] },
      { id: 'e1-pull', title: 'pull --rebase and force-with-lease', blocks: [
        { id: 'e1-t4', type: 'text', html: '<p>When you and a teammate both added commits to <code>main</code>, a plain <code>git pull</code> adds a merge commit. <code>git pull --rebase</code> instead replays <i>your unpushed</i> commits on top of what you fetched. This is safe: nobody has your commits yet.</p>' },
        { id: 'e1-sim3', type: 'interactive', widget: 'terminal', title: 'Pull without a merge commit',
          caption: 'A teammate already pushed a commit. You made one locally in <code>~/notes</code>.',
          config: {
            world: { me: 'aino', config: cfg, cwd: '~',
              remotes: { 'aino/notes': { collaborators: { aino: 'write' }, commits: [{ msg: 'Start notes', author: 'aino', files: { 'notes.md': '# Notes\n' } }] } },
              run: ['git clone https://github.com/aino/notes.git', 'git clone https://github.com/aino/notes.git team', 'cd team', 'echo "Ideas" > ideas.md', 'git add .', 'git commit -m "Teammate: add ideas"', 'git push', 'cd ~/notes', 'echo "Todo" > todo.md', 'git add .', 'git commit -m "Add todo list"'] },
            panels: ['graph'],
            tasks: [
              { id: 'pull', text: 'Bring in the teammate\'s commit and keep a straight history: <code>git pull --rebase</code>', check: function (w) { var m = msgs(w); return m.indexOf('Teammate: add ideas') >= 0 && m[0] === 'Add todo list' && linear(w); }, hint: 'A normal git pull would make a merge commit.', solution: 'git pull --rebase' }
            ] } },
        { id: 'e1-t5', type: 'text', html: '<p>After rebasing commits you <i>already pushed</i> (on your own private branch only!), the server refuses a normal push because your history differs. Use <code>git push --force-with-lease</code>: it overwrites the remote branch only if nobody added to it since you last fetched. Plain <code>--force</code> overwrites blindly and can erase a teammate\'s work.</p>' },
        { id: 'e1-qe', type: 'question', q: 'e1-q-lease' }
      ] },
      { id: 'e1-int', title: 'Interactive rebase and squash merge', blocks: [
        { id: 'e1-t6', type: 'text', html: '<p><code>git rebase -i HEAD~4</code> opens a to-do list of your last four commits, oldest first. You change the word at the start of each line, save, and Git replays the commits accordingly. The simulator does not run it, so read this example.</p>' },
        { id: 'e1-code', type: 'code', lang: 'text', title: 'The to-do list', code: 'pick   a1b2c3d Add contact page\nsquash e4f5a6b Fix layout\nreword 7c8d9e0 chnage footer\ndrop   1f2e3d4 Debug print' },
        { id: 'e1-qf', type: 'question', q: 'e1-q-todo' },
        { id: 'e1-t7', type: 'text', html: '<p>On GitHub, a pull request can do the tidying for you: the <b>Squash and merge</b> button turns all the branch\'s commits into one commit on <code>main</code>. History stays linear and nobody rewrites shared commits. The branch\'s own commits are not reused, so delete the branch afterwards.</p>' },
        { id: 'e1-c4', type: 'callout', kind: 'staff', title: 'Which one to use?', html: 'Not sure? Merge. Rebase your own unpushed or private work before sharing it; use squash merge for small pull requests where the individual commits are noise.' },
        { id: 'e1-qg', type: 'question', q: 'e1-q-order' }
      ] },
      { id: 'e1-sum', title: 'Summary', blocks: [
        { id: 'e1-sumlist', type: 'list', items: [
          'Merge keeps true history; rebase replays commits for a straight line, with new ids.',
          'Golden rule: never rebase commits others already have.',
          '<code>git cherry-pick &lt;commit&gt;</code> copies one commit to the current branch.',
          '<code>git pull --rebase</code> avoids needless merge commits.',
          'After rewriting pushed private commits use <code>--force-with-lease</code>, never plain <code>--force</code>.',
          '<code>rebase -i</code>: pick, squash, reword, drop.'] }
      ] }
    ],
    questions: [
      { id: 'e1-q-rule', type: 'mc', prompt: 'Ben pushed <code>feature</code> and Aino pulled it. Ben now wants a straight history. What should he do?',
        options: ['Rebase <code>feature</code> and force-push; it is his branch', 'Merge <code>main</code> into <code>feature</code> instead of rebasing', 'Delete the branch and start over secretly'],
        answer: 1, hints: ['Who else holds these commits?'], explain: 'Aino already has the commits, so rewriting them would put her copy out of sync. Merging never rewrites existing commits.' },
      { id: 'e1-q-newids', type: 'multi', prompt: 'After <code>git rebase main</code>, which statements are true?',
        options: ['Your commits get new ids', 'The commit messages are lost', 'History is a straight line', 'main moves forward'],
        answer: [0, 2], explain: 'Replayed commits are new commits with the same message and change. <code>main</code> does not move until you merge.' },
      { id: 'e1-q-pick', type: 'fill', prompt: 'Complete the command that copies commit <code>a1b2c3d</code> to the current branch.', text: 'git [[a]] a1b2c3d',
        answer: { a: ['cherry-pick'] }, hints: ['It is a fruit.'], explain: '<code>git cherry-pick</code> picks one commit and applies it here.' },
      { id: 'e1-q-lease', type: 'mc', prompt: 'Why is <code>--force-with-lease</code> safer than <code>--force</code>?',
        options: ['It refuses to overwrite commits you have not seen', 'It keeps the old history as a backup', 'It only works on your own computer'],
        answer: 0, explain: 'If someone pushed since your last fetch, the push is rejected instead of erasing their work.' },
      { id: 'e1-q-todo', type: 'match', prompt: 'Match each word in the interactive rebase to-do list to its effect.',
        pairs: [['pick', 'keep the commit as it is'], ['squash', 'melt into the previous commit'], ['reword', 'keep, but edit the message'], ['drop', 'remove the commit']], explain: '<code>squash</code> combines a commit with the one above it; <code>reword</code> keeps the change but lets you rewrite the message.' },
      { id: 'e1-q-order', type: 'order', prompt: 'Put the steps of a rebase workflow in order.',
        items: ['git switch feature', 'git rebase main', 'git switch main', 'git merge feature'], explain: 'Rebase from <code>feature</code>, then go to <code>main</code> and merge: it fast-forwards, so no merge commit appears.' }
    ]
  });
})();
