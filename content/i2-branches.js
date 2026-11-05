/* i2 = 2.2 Branches (git track). Two terminal simulators: a fast-forward merge, then a diverging merge. */
(function () {
  var CFG = { 'user.name': 'Aino Student', 'user.email': 'aino@example.com', 'init.defaultBranch': 'main' };
  var SETUP = ['git init', 'git add .', 'git commit -m "Add chapters 1 and 2"'];
  function files() { return { '~/thesis/chapter-1.md': '# Chapter 1\n', '~/thesis/chapter-2.md': '# Chapter 2\n' }; }
  // Figure: main line, a side branch that diverges after B and merges back as commit M.
  var FIG = '<svg viewBox="0 0 520 160" role="img" aria-label="Commits on main and on a side branch that is merged back" style="width:100%;max-width:560px;height:auto" fill="none" stroke="currentColor" stroke-width="2.5">' +
    '<path d="M40 40H480"/><path d="M120 40C150 40 150 110 190 110H300C340 110 340 40 380 40" stroke="var(--c-2)"/>' +
    '<circle cx="40" cy="40" r="11" fill="var(--c-1)"/><circle cx="120" cy="40" r="11" fill="var(--c-1)"/><circle cx="250" cy="40" r="11" fill="var(--c-1)"/>' +
    '<circle cx="380" cy="40" r="11" fill="var(--c-3)"/><circle cx="480" cy="40" r="11" fill="var(--c-1)"/>' +
    '<circle cx="190" cy="110" r="11" fill="var(--c-2)"/><circle cx="300" cy="110" r="11" fill="var(--c-2)"/>' +
    '<g fill="currentColor" stroke="none" font-size="14" font-family="inherit" text-anchor="middle">' +
    '<text x="40" y="20">A</text><text x="120" y="20">B</text><text x="250" y="20">C</text><text x="380" y="20">M</text><text x="480" y="20">N</text>' +
    '<text x="190" y="140">D</text><text x="300" y="140">E</text>' +
    '<text x="480" y="68" font-weight="bold">main</text><text x="245" y="156" font-weight="bold">chapter-3</text></g></svg>';

  TDC.registerTopic({
    id: 'i2',
    title: 'Branches',
    subtitle: 'Work on an idea without touching the main version: create, switch and merge branches, and read the commit graph.',
    audience: 'everyone who commits with Git · after lessons 1.5 and 2.1',
    objectives: ['explain why branches exist', 'create, list, switch and delete branches', 'make commits on a branch and see the files change when you switch',
      'merge a branch with a fast-forward and with a merge commit', 'read the commit graph and find HEAD'],
    glossary: {
      branch: { term: 'branch', def: 'A movable name that points at one commit. New commits made while a branch is checked out move that name forward, so a branch is a separate line of work.' },
      head: { term: 'HEAD', def: 'Git’s “you are here” marker. Normally it points at the branch you are on, and that branch points at its latest commit.' },
      merge: { term: 'merge', def: 'Bring the commits of another branch into the branch you are on.' },
      fastforward: { term: 'fast-forward', def: 'A merge where the current branch has no new commits of its own, so Git just moves its name forward. No merge commit is made.' }
    },
    commands: [
      { cmd: 'git branch', does: 'List branches (the current one has *)' },
      { cmd: 'git branch <name>', does: 'Create a branch at the current commit, without switching' },
      { cmd: 'git switch -c <name>', does: 'Create a branch and switch to it' },
      { cmd: 'git switch <name>', does: 'Switch to an existing branch' },
      { cmd: 'git merge <name>', does: 'Merge branch <name> into the current branch' },
      { cmd: 'git branch -d <name>', does: 'Delete a branch that is already merged' },
      { cmd: 'git log --oneline --graph --all', does: 'Draw the history of all branches' }
    ],
    sections: [
      { id: 'i2-why', title: 'Why branches?', blocks: [
        { id: 'i2-why-t', type: 'text', html: '<p>Aino’s thesis works. Her supervisor has read chapters 1 and 2. Now Aino wants to try writing chapter 3, but she does not want half-finished text to land in the version she shares.</p><p>A <dfn data-term="branch">branch</dfn> solves this. It is a separate line of work that starts from a commit you choose. You can commit on it as often as you like, and the main version stays untouched. When the idea is good, you <dfn data-term="merge">merge</dfn> it back. If it is not, you delete the branch.</p>' },
        { id: 'i2-why-fig', type: 'figure', svg: FIG, alt: 'Commits A, B, C on main. Commits D and E on branch chapter-3 start from B. Commit M merges them on main, then N follows.',
          caption: 'Commits A and B are shared. From B, <b>chapter-3</b> grows with D and E while <b>main</b> gets C. Commit M is a <b>merge commit</b>: it has two parents, C and E.' },
        { id: 'i2-why-c', type: 'callout', kind: 'key', title: 'Key idea', html: 'A branch is only a <b>name that points at a commit</b>. Creating one is instant and free: Git copies nothing.' },
        { id: 'i2-why-q', type: 'question', q: 'i2-q-why' }
      ] },
      { id: 'i2-create', title: 'Create, switch and commit', blocks: [
        { id: 'i2-cr-t', type: 'text', html: '<p><code>git switch -c chapter-3</code> creates the branch and moves you onto it. <code>git branch</code> lists all branches; the one with <code>*</code> is where you are. The marker that says where you are is <dfn data-term="head">HEAD</dfn>.</p>' },
        { id: 'i2-cr-tabs', type: 'tabs', group: 'tool', tabs: [
          { label: 'Terminal', icon: '⌨️', blocks: [{ id: 'i2-cr-term', type: 'code', lang: 'bash', code: '$ git switch -c chapter-3\nSwitched to a new branch \'chapter-3\'\n$ git branch\n* chapter-3\n  main\n$ git switch main\nSwitched to branch \'main\'' }] },
          { label: 'GitHub Desktop', icon: '🖥️', blocks: [{ id: 'i2-cr-gd', type: 'text', html: '<p>Click <b>Current branch</b> in the top bar, then <b>New branch</b>, type the name and click <b>Create branch</b>. To switch, open <b>Current branch</b> again and click the branch you want.</p>' }] },
          { label: 'VS Code', icon: '🧩', blocks: [{ id: 'i2-cr-vs', type: 'text', html: '<p>Click the branch name at the bottom-left of the window (the status bar). A list opens at the top: choose <b>Create new branch…</b>, type a name and press <kbd>Enter</kbd>, or pick an existing branch to switch to it.</p>' }] }
        ] },
        { id: 'i2-cr-c', type: 'callout', kind: 'warn', html: 'Files belong to the branch you are on. When you switch, Git rewrites your folder to match that branch: files made only on the other branch <b>disappear</b> and come back when you switch again. They are not lost. Commit your work first, or Git may refuse to switch.' },
        { id: 'i2-sim1', type: 'interactive', widget: 'terminal', title: 'Make a branch, commit on it and merge it',
          caption: 'Watch the graph: HEAD moves with you. Chapter 3 will be a new file made on the branch.',
          config: {
            world: { config: CFG, cwd: '~/thesis', files: files(), run: SETUP },
            panels: ['graph', 'areas'],
            tasks: [
              { id: 'create', text: 'Create a branch <code>chapter-3</code> and switch to it', check: function (w) { var r = w.repo(); return !!r && r.heads['chapter-3'] !== undefined && r.HEAD.branch === 'chapter-3'; }, solution: 'git switch -c chapter-3' },
              { id: 'commit', text: 'Make a file <code>chapter-3.md</code> and commit it on <code>chapter-3</code>', hint: 'echo "# Chapter 3" > chapter-3.md, then git add and git commit -m.',
                check: function (w) { var r = w.repo(); return !!r && r.heads['chapter-3'] !== undefined && w.commitsOn(r, 'chapter-3').length > w.commitsOn(r, 'main').length; },
                solution: 'echo "# Chapter 3" > chapter-3.md ; git add chapter-3.md ; git commit -m "Start chapter 3"' },
              { id: 'back', text: 'Switch back to <code>main</code> and run <code>ls</code>: <code>chapter-3.md</code> is gone', hint: 'git switch main',
                check: function (w) { var r = w.repo(); return !!r && r.HEAD.branch === 'main' && r.heads['chapter-3'] !== undefined && w.commitsOn(r, 'chapter-3').length > w.commitsOn(r, 'main').length && !('chapter-3.md' in w.workTree(r)); }, solution: 'git switch main' },
              { id: 'ff', text: 'Merge <code>chapter-3</code> into <code>main</code>', hint: 'Be on main, then git merge chapter-3.',
                check: function (w) { var r = w.repo(); return !!r && r.HEAD.branch === 'main' && r.heads['chapter-3'] !== undefined && r.heads.main === r.heads['chapter-3'] && 'chapter-3.md' in w.headTree(r); }, solution: 'git merge chapter-3' }
            ]
          } },
        { id: 'i2-cr-q', type: 'question', q: 'i2-q-switch' }
      ] },
      { id: 'i2-merge', title: 'Merging: fast-forward or merge commit', blocks: [
        { id: 'i2-mg-t', type: 'text', html: '<p>You merge <em>into</em> the branch you are on: switch to the receiving branch first (usually <code>main</code>), then run <code>git merge &lt;other&gt;</code>. Git does one of two things.</p>' },
        { id: 'i2-mg-tab', type: 'table', head: ['Situation', 'What Git does', 'Message'],
          rows: [['<code>main</code> has no new commits since the branch started', 'a <dfn data-term="fastforward">fast-forward</dfn>: moves <code>main</code> forward, no new commit', '<code>Fast-forward</code>'],
                 ['both branches have new commits (they <b>diverged</b>)', 'a <b>merge commit</b> with two parents', '<code>Merge made by the \'ort\' strategy.</code>']] },
        { id: 'i2-mg-det', type: 'details', summary: 'Can I get a merge commit even when a fast-forward is possible?', html: 'Yes: <code>git merge --no-ff &lt;name&gt;</code>. It keeps a visible record that a group of commits was a separate piece of work. For a small thesis project the default is fine.' },
        { id: 'i2-mg-q', type: 'question', q: 'i2-q-ff' },
        { id: 'i2-sim2', type: 'interactive', widget: 'terminal', title: 'Diverge two branches and merge them',
          caption: 'Each branch adds a different file, so the merges have no conflicts (conflicts come in the next lesson). Real Git may open an editor to confirm the merge message; the simulator fills it in.',
          config: {
            world: { config: CFG, cwd: '~/thesis', files: files(), run: SETUP },
            panels: ['graph'],
            tasks: [
              { id: 'two', text: 'Create branches <code>abstract</code> and <code>references</code>, each with one commit of its own (a new file), both started from <code>main</code>',
                hint: 'Branch, make a file, add, commit, switch to main, repeat.',
                check: function (w) { var r = w.repo(); return !!r && !!r.heads.abstract && !!r.heads.references && w.commitsOn(r, 'abstract').length > w.commitsOn(r, 'main').length && w.commitsOn(r, 'references').length > w.commitsOn(r, 'main').length; },
                solution: 'git switch -c abstract ; echo "Abstract" > abstract.md ; git add . ; git commit -m "Add abstract" ; git switch main ; git switch -c references ; echo "Refs" > references.md ; git add . ; git commit -m "Add references"' },
              { id: 'ff2', text: 'On <code>main</code>, merge <code>abstract</code> (a fast-forward)', hint: 'git switch main, then git merge abstract.',
                check: function (w) { var r = w.repo(); return !!r && !!r.heads.abstract && r.HEAD.branch === 'main' && 'abstract.md' in w.headTree(r); }, solution: 'git switch main ; git merge abstract' },
              { id: 'mc', text: 'Merge <code>references</code> too. This time Git makes a <b>merge commit</b>', hint: 'main moved on, so this one cannot fast-forward.',
                check: function (w) { var r = w.repo(); var c = r && w.commitsOn(r, 'main')[0]; return !!c && c.parents.length === 2 && 'references.md' in w.headTree(r); }, solution: 'git merge references' },
              { id: 'del', text: 'Delete both merged branches, then run <code>git log --oneline --graph --all</code>', hint: 'git branch -d <name>',
                check: function (w) { var r = w.repo(); return !!r && !r.heads.abstract && !r.heads.references && w.commitsOn(r, 'main')[0].parents.length === 2; }, solution: 'git branch -d abstract ; git branch -d references' }
            ]
          } },
        { id: 'i2-mg-c', type: 'callout', kind: 'tip', html: 'After a merge the branch name is no longer needed: its commits are now part of <code>main</code>. <code>git branch -d</code> only deletes the <em>name</em>, and refuses if the branch is not merged (<code>-D</code> forces it).' }
      ] },
      { id: 'i2-graph', title: 'Reading the graph', blocks: [
        { id: 'i2-gr-t', type: 'text', html: '<p><code>git log --oneline --graph --all</code> draws every branch. Read it from the top (newest) down. <code>*</code> marks a commit; <code>(HEAD -&gt; main)</code> says which branch you are on, and other names show where other branches point.</p>' },
        { id: 'i2-gr-code', type: 'code', lang: 'bash', code: '$ git log --oneline --graph --all\n*   a1b2c3d (HEAD -> main) Merge branch \'references\'\n|\\\n| * 9f8e7d6 (references) Add references\n* | 5c4b3a2 Add abstract\n|/\n* 1234567 Add chapters 1 and 2' },
        { id: 'i2-gr-q', type: 'question', q: 'i2-q-graph' }
      ] },
      { id: 'i2-summary', title: 'Summary', blocks: [
        { id: 'i2-sum', type: 'list', items: ['A branch is a movable name for a line of work; creating one is instant.', '<code>git switch -c name</code> creates and switches; <code>git switch name</code> switches. Your folder changes to match.', 'Merge <em>into</em> the branch you are on: <code>git merge name</code>.', 'Fast-forward if the receiver has no new commits, otherwise a merge commit with two parents.', 'Delete merged branches with <code>git branch -d</code>.', '<code>git log --oneline --graph --all</code> shows the whole picture; HEAD shows where you are.'] }
      ] }
    ],
    questions: [
      { id: 'i2-q-why', type: 'mc', prompt: 'Why would Aino make a branch for chapter 3?', options: ['Git needs one branch per file', 'To try her work without changing the main version until it is ready', 'To upload the thesis to GitHub', 'To make Git copy the whole project folder'], answer: 1, hints: ['Think about what stays untouched.'], explain: 'A branch keeps experimental work apart from <code>main</code>. Git does not copy the project; a branch is just a name pointing at a commit.' },
      { id: 'i2-q-switch', type: 'mc', prompt: 'On branch <code>chapter-3</code> you committed <code>chapter-3.md</code>. You run <code>git switch main</code>. What happens to the file?', options: ['It is deleted from the repository for good', 'It disappears from the folder but is still safe on chapter-3', 'It is copied to main automatically', 'Git refuses to switch'], answer: 1, hints: ['Which branch contains the commit?'], explain: 'The commit still exists on <code>chapter-3</code>. Switching only changes what the folder shows. The file returns when you switch back.' },
      { id: 'i2-q-ff', type: 'mc', prompt: 'You branched from <code>main</code>, made two commits, and nobody changed <code>main</code> meanwhile. What does <code>git merge</code> (run on main) do?', options: ['A fast-forward: main moves to the branch’s last commit', 'It creates a merge commit with two parents', 'It reports a conflict', 'It deletes the branch'], answer: 0, explain: 'The branch is simply ahead of <code>main</code>, so Git moves the <code>main</code> name forward. A merge commit appears only when both sides have new commits.' },
      { id: 'i2-q-fill', type: 'fill', prompt: 'Complete the commands.', text: 'Create and switch to a branch called draft: git [[a]] draft<br>Delete it after merging: git branch [[b]] draft', answer: { a: ['switch -c', 'checkout -b'], b: ['-d', '--delete'] }, explain: '<code>-c</code> means create. <code>-d</code> deletes only a branch that is already merged.' },
      { id: 'i2-q-order', type: 'order', prompt: 'Put the steps in order to bring a finished branch <code>idea</code> into <code>main</code>.', items: ['<code>git switch main</code>', '<code>git merge idea</code>', '<code>git branch -d idea</code>'], explain: 'Switch to the receiver, merge, then remove the finished name.' },
      { id: 'i2-q-graph', type: 'match', prompt: 'Match each graph symbol to its meaning.', pairs: [['<code>(HEAD -&gt; main)</code>', 'you are on main, at this commit'], ['<code>*</code>', 'a commit'], ['<code>|\\</code> and <code>|/</code>', 'branches splitting and joining'], ['two parents', 'a merge commit']], explain: 'The graph lines show how history splits and joins.' }
    ]
  });
})();
