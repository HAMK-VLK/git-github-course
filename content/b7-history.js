/* b7 = Looking back: history and differences (terminal simulator with a pre-built history). */
(function () {
  // Aino's thesis folder: 4 commits; `extra` are further setup commands (left uncommitted).
  function world(extra) {
    return {
      config: { 'user.name': 'Aino Student', 'user.email': 'aino@example.com', 'init.defaultBranch': 'main' },
      cwd: '~/thesis',
      files: { '~/thesis/chapter1.md': '# Chapter 1\nIntroduction draft.\n' },
      run: [
        'git init', 'git add .', 'git commit -m "Add chapter 1 draft"',
        'echo "# Chapter 2\nMethods." > chapter2.md', 'git add .', 'git commit -m "Add chapter 2"',
        'echo "# Chapter 1\nIntroduction draft.\nWhy this topic matters." > chapter1.md', 'git commit -am "Expand introduction"',
        'echo "# Chapter 2\nMethods, with a survey." > chapter2.md', 'git commit -am "Describe the survey in chapter 2"'
      ].concat(extra || [])
    };
  }
  function ranRe(w, re) { return w.log.some(function (l) { return !l.code && re.test(l.cmd); }); }

  TDC.registerTopic({
    id: 'b7',
    title: 'Looking back: history and differences',
    subtitle: 'Read your project\'s history, see exactly what changed, and bring back or throw away work.',
    audience: 'everyone · after your first commits',
    objectives: [
      'read the history with git log (--oneline, -N)',
      'inspect one commit with git show',
      'see changes with git diff and git diff --staged',
      'bring back an old version of a file with git restore --source',
      'discard unsaved edits with git restore'
    ],
    glossary: {
      diff: { term: 'diff', def: 'A list of the lines that changed between two versions of a file: lines starting with <code>-</code> were removed, lines starting with <code>+</code> were added.' },
      'commit-hash': { term: 'commit hash (SHA)', def: 'The long code that identifies one commit, such as <code>3f9a1c2…</code>. The first 7 characters are enough to name it.' }
    },
    commands: [
      { cmd: 'git log', does: 'List the commits, newest first' },
      { cmd: 'git log --oneline', does: 'One short line per commit' },
      { cmd: 'git log -3', does: 'Only the last 3 commits' },
      { cmd: 'git show <hash>', does: 'Show one commit: message and changes' },
      { cmd: 'git diff', does: 'Show edits that are not staged yet' },
      { cmd: 'git diff --staged', does: 'Show what is staged for the next commit' },
      { cmd: 'git restore --source <hash> <file>', does: 'Copy a file as it was in an older commit into your folder' },
      { cmd: 'git restore <file>', does: 'Throw away unsaved edits to a file (cannot be undone)' }
    ],
    sections: [
      { id: 'b7-log', title: 'Reading the log', blocks: [
        { id: 'b7-log-t', type: 'text', html: '<p>Every commit you make stays in the <dfn data-term="repository">repository</dfn>. <code>git log</code> lists them, newest first. Each entry has a <dfn data-term="commit-hash">commit hash</dfn> (its unique name), the author, the date and your message.</p>' },
        { id: 'b7-log-code', type: 'code', lang: 'bash', code: '$ git log\ncommit 9a2f4c1d7e3b8a60c5d1f2e4b7a9c3d5e6f70812\nAuthor: Aino Student <aino@example.com>\nDate:   Tue Sep 1 09:20:00 2026 +0300\n\n    Fix typos in chapter 2\n\n$ git log --oneline\n9a2f4c1 Fix typos in chapter 2' },
        { id: 'b7-log-c', type: 'callout', kind: 'tip', title: 'Long log?', html: 'Use <code>git log --oneline</code> for a quick overview and <code>git log -3</code> for the last three commits. In a real terminal a long log opens in a pager: press <kbd>q</kbd> to leave it.' },
        { id: 'b7-log-sim', type: 'interactive', widget: 'terminal', title: 'Read the history of a thesis',
          caption: 'Aino\'s <code>thesis</code> folder already has four commits. Type commands and press Enter.',
          config: {
            world: world(),
            panels: ['graph'],
            tasks: [
              { id: 'log', text: 'List the commits in short form: <code>git log --oneline</code>', check: function (w) { return ranRe(w, /^git log\b.*--oneline/); }, solution: 'git log --oneline' },
              { id: 'log2', text: 'Show only the last two commits: <code>git log -2</code>', check: function (w) { return ranRe(w, /^git log\b.*-2\b/); }, solution: 'git log -2' }
            ]
          } },
        { id: 'b7-q-fill-blk', type: 'question', q: 'b7-q-fill' }
      ] },
      { id: 'b7-diff', title: 'What changed: diff and show', blocks: [
        { id: 'b7-diff-t', type: 'text', html: '<p>The log tells you <em>that</em> something changed; a <dfn data-term="diff">diff</dfn> tells you <em>what</em>. Lines starting with <code>-</code> were removed and lines starting with <code>+</code> were added.</p><ul><li><code>git show &lt;hash&gt;</code> shows one commit: its message and its changes.</li><li><code>git diff</code> shows edits you have made but not staged yet.</li><li><code>git diff --staged</code> shows what you have staged for the next commit.</li></ul>' },
        { id: 'b7-diff-c', type: 'callout', kind: 'tip', title: 'Reading the @@ line', html: 'A header like <code>@@ -1,3 +1,4 @@</code> means: this piece starts at line 1 and was 3 lines long in the old version, and starts at line 1 and is 4 lines long in the new one. You rarely need it; the red <code>-</code> and green <code>+</code> lines tell the story.' },
        { id: 'b7-q-diff-blk', type: 'question', q: 'b7-q-diff' },
        { id: 'b7-diff-sim', type: 'interactive', widget: 'terminal', title: 'Find and inspect a change',
          caption: 'Copy a hash from <code>git log --oneline</code>. Aino has also edited <code>chapter2.md</code> again since her last commit.',
          config: {
            world: world(['echo "# Chapter 2\nMethods, with a survey.\nInterviews with 5 students." > chapter2.md']),
            panels: ['areas', 'graph'],
            tasks: [
              { id: 'show', text: 'Show the commit that added chapter 2: find its hash with <code>git log --oneline</code>, then run <code>git show &lt;hash&gt;</code>',
                check: function (w) {
                  var c = w.commitsOn(w.repo()).filter(function (x) { return x.msg === 'Add chapter 2'; })[0];
                  return !!c && w.log.some(function (l) { var m = !l.code && /^git show\s+([0-9a-f]{4,40})\s*$/.exec(l.cmd); return !!m && c.sha.indexOf(m[1]) === 0; });
                },
                hint: 'Copy the code in front of "Add chapter 2" in the log.', solution: 'git log --oneline, then git show <hash of "Add chapter 2">' },
              { id: 'diff', text: 'See your unstaged edit: <code>git diff</code>', check: function (w) { return ranRe(w, /^git diff\s*(chapter2\.md)?\s*$/); }, solution: 'git diff' },
              { id: 'staged', text: 'Stage <code>chapter2.md</code>, then run <code>git diff --staged</code>',
                check: function (w) { return w.status(w.repo()).staged.length > 0 && ranRe(w, /^git diff --(staged|cached)/); },
                hint: 'Plain git diff is empty after staging; that is why --staged exists.', solution: 'git add chapter2.md, then git diff --staged' }
            ]
          } }
      ] },
      { id: 'b7-old', title: 'Bring back an old version', blocks: [
        { id: 'b7-old-t', type: 'text', html: '<p>Nothing you committed is lost. To get a file back as it was in an older commit, give <code>git restore</code> the commit\'s hash:</p>' },
        { id: 'b7-old-code', type: 'code', lang: 'bash', code: '$ git restore --source 3f9a1c2 chapter1.md' },
        { id: 'b7-old-t2', type: 'text', html: '<p>This copies the old version into your folder. It shows up as a normal edit, so you still stage and commit it. History is not rewritten: the old versions stay in the log and the restore becomes one more commit.</p>' },
        { id: 'b7-old-c', type: 'callout', kind: 'warn', html: '<code>git restore --source</code> overwrites the file in your folder. Commit any edits you want to keep before you run it.' },
        { id: 'b7-q-order-blk', type: 'question', q: 'b7-q-order' }
      ] },
      { id: 'b7-discard', title: 'Throw away an edit', blocks: [
        { id: 'b7-discard-t', type: 'text', html: '<p>Edited a file by accident? <code>git restore &lt;file&gt;</code> puts it back to the last staged or committed version.</p>' },
        { id: 'b7-discard-c', type: 'callout', kind: 'warn', title: 'No undo', html: 'Edits that were never committed are not in Git\'s history, so discarding them cannot be undone. Check with <code>git diff</code> first.' },
        { id: 'b7-q-discard-blk', type: 'question', q: 'b7-q-discard' },
        { id: 'b7-all-sim', type: 'interactive', widget: 'terminal', title: 'Restore an old version, then discard an edit',
          caption: 'Chapter 1 was better in the first draft, and <code>chapter2.md</code> has an accidental edit.',
          config: {
            world: world(['echo "oops, wrong text" > chapter2.md']),
            panels: ['areas', 'graph'],
            tasks: [
              { id: 'restore', text: 'Bring back <code>chapter1.md</code> as it was in the first commit: <code>git restore --source &lt;hash&gt; chapter1.md</code>',
                check: function (w) { return w.workTree(w.repo())['chapter1.md'] === '# Chapter 1\nIntroduction draft.\n'; },
                hint: 'The first commit is the last line of git log --oneline.', solution: 'git restore --source <hash of "Add chapter 1 draft"> chapter1.md' },
              { id: 'commit', text: 'Stage and commit that file only',
                check: function (w) { var r = w.repo(); return w.commitsOn(r).length > 4 && w.headTree(r)['chapter1.md'] === '# Chapter 1\nIntroduction draft.\n'; },
                hint: 'git add chapter1.md, then git commit -m "...". Avoid commit -a: it would also commit the accidental edit.', solution: 'git add chapter1.md, then git commit -m "Go back to the first introduction"' },
              { id: 'discard', text: 'Throw away the accidental edit in <code>chapter2.md</code>',
                check: function (w) { var r = w.repo(); return ranRe(w, /^git restore (?!.*--source)(?!.*--staged).*chapter2\.md/) && w.workTree(r)['chapter2.md'] === w.headTree(r)['chapter2.md']; },
                solution: 'git restore chapter2.md' }
            ]
          } }
      ] },
      { id: 'b7-gui', title: 'The same in a graphical app', blocks: [
        { id: 'b7-gui-t', type: 'text', html: '<p>Both apps show the same history without commands. There is no simulator for them in this lesson; the tables show where to click.</p>' },
        { id: 'b7-gui-tabs', type: 'tabs', group: 'tool', tabs: [
          { label: 'Terminal', icon: '⌨️', blocks: [{ id: 'b7-gt-t', type: 'text', html: '<p><code>git log --oneline</code>, <code>git show &lt;hash&gt;</code>, <code>git diff</code>, <code>git restore</code>.</p>' }] },
          { label: 'GitHub Desktop', icon: '🖥️', blocks: [{ id: 'b7-gd-t', type: 'table', head: ['Goal', 'Where'], rows: [
            ['Read the log', 'Left panel, <b>History</b> tab: one row per commit'],
            ['See what a commit changed', 'Click the commit; the changed files and lines appear on the right'],
            ['See unsaved edits', '<b>Changes</b> tab: click a file to see added and removed lines'],
            ['Discard an edit', 'Right-click the file in <b>Changes</b>, then <b>Discard Changes…</b>']
          ] }] },
          { label: 'VS Code', icon: '🧩', blocks: [{ id: 'b7-vs-t', type: 'table', head: ['Goal', 'Where'], rows: [
            ['History of one file', 'Explorer, then the <b>Timeline</b> view at the bottom; click an entry to see the diff'],
            ['History of the repository', '<b>Source Control</b> view, <b>Source Control Graph</b> section'],
            ['See unsaved edits', '<b>Source Control</b> view: click a changed file to open the diff'],
            ['Discard an edit', 'Hover the file in <b>Changes</b>, click <b>Discard Changes</b> (the curved arrow)']          ] }] }
        ] },
        { id: 'b7-q-gui-blk', type: 'question', q: 'b7-q-gui' }
      ] },
      { id: 'b7-summary', title: 'Summary', blocks: [
        { id: 'b7-sum', type: 'list', items: [
          '<code>git log --oneline</code> and <code>git log -N</code> read the history; <code>git show &lt;hash&gt;</code> opens one commit.',
          '<code>git diff</code> shows unstaged edits; <code>git diff --staged</code> shows what the next commit will contain.',
          '<code>git restore --source &lt;hash&gt; &lt;file&gt;</code> brings back an old version; commit it to keep it.',
          '<code>git restore &lt;file&gt;</code> discards unsaved edits for good.'
        ] }
      ] }
    ],
    questions: [
      { id: 'b7-q-diff', type: 'mc', prompt: 'You edited <code>notes.md</code> and have not run <code>git add</code>. Which command shows your edit?',
        options: ['git diff', 'git diff --staged', 'git log', 'git show'], answer: 0, shuffle: false, hints: ['Staged means "chosen for the next commit".'],
        explain: '<code>git diff</code> compares your folder with the staging area. <code>--staged</code> would be empty because nothing is staged; <code>log</code> and <code>show</code> look at commits only.' },
      { id: 'b7-q-order', type: 'order', prompt: 'Put the steps in order to bring back an old version of <code>chapter1.md</code>.',
        items: ['<code>git log --oneline</code> (find the hash)', '<code>git restore --source &lt;hash&gt; chapter1.md</code>', '<code>git add chapter1.md</code>', '<code>git commit -m "Bring back first draft"</code>'], explain: 'Find the hash first, copy the old file into your folder, stage it, then commit it.' },
      { id: 'b7-q-discard', type: 'mc', prompt: 'You ran <code>git restore report.md</code> to drop an accidental edit. Can you get the edit back?',
        options: ['Yes, with git log', 'Yes, with git restore --staged', 'No, edits that were never committed are gone', 'Yes, after git pull'], answer: 2, shuffle: false,
        hints: ['Git only remembers commits.'], explain: 'Git can only bring back what was committed. An uncommitted edit is not in the history, so discarding it is permanent.' },
      { id: 'b7-q-fill', type: 'fill', prompt: 'Complete the command to see only the last 3 commits, one line each.', text: 'git log [[a]]',
        answer: { a: ['--oneline -3', '-3 --oneline', '--oneline -n 3', '-n 3 --oneline', '--oneline -n3', '-n3 --oneline', '--oneline --max-count=3'] }, explain: '<code>--oneline</code> shortens each entry and <code>-3</code> limits the count.' },
      { id: 'b7-q-gui', type: 'match', prompt: 'Match the app feature to what it shows.',
        pairs: [['GitHub Desktop: History tab', 'the commits of the repository'], ['GitHub Desktop: Changes tab', 'edits not committed yet'], ['VS Code: Timeline view', 'the history of the open file']], explain: 'History lists commits, Changes lists work not yet committed, Timeline follows one file.' },
      { id: 'b7-q-multi', type: 'multi', prompt: 'Which commands change a file in your folder?',
        options: ['<code>git restore --source &lt;hash&gt; file</code>', '<code>git restore file</code>', '<code>git log</code>', '<code>git diff</code>'], answer: [0, 1], explain: 'Both restore forms overwrite the file. <code>log</code> and <code>diff</code> only read.' }
    ]
  });
})();
