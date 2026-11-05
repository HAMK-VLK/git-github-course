/* i4 = 2.4 Undoing things safely. Simulator notes: git commit needs -m (no editor); `git revert` makes its
 * message automatically (real Git opens an editor unless you add --no-edit). */
TDC.registerTopic({
  id: 'i4',
  title: 'Undoing things safely',
  subtitle: 'Every mistake in Git has an undo. The trick is picking the right one.',
  audience: 'students and staff who keep course material · after Merge conflicts',
  objectives: [
    'pick the right undo from the decision table',
    'unstage a file and discard an unwanted edit with git restore',
    'fix the last commit with git commit --amend',
    'undo a commit that is already pushed with git revert',
    'move back with git reset --soft and recommit, and explain why reset --hard is dangerous',
    'park unfinished work with git stash'
  ],
  glossary: {
    amend: { term: 'amend', def: 'Replace the most recent commit with a corrected one (new message and/or new content). The old commit disappears from the branch.' },
    revert: { term: 'revert', def: 'Add a <em>new</em> commit that does the opposite of an earlier commit. History is kept, so it is safe to share.' },
    reset: { term: 'reset', def: 'Move the current branch back to an earlier commit. Depending on the option, staged and working changes are kept (<code>--soft</code>, <code>--mixed</code>) or thrown away (<code>--hard</code>).' },
    stash: { term: 'stash', def: 'A shelf where Git parks your uncommitted changes so you can work on something else, then bring them back with <code>git stash pop</code>.' }
  },
  commands: [
    { cmd: 'git restore <file>', does: 'Throw away unsaved edits in a file (cannot be undone)' },
    { cmd: 'git restore --staged <file>', does: 'Unstage a file but keep your edits' },
    { cmd: 'git commit --amend -m "msg"', does: 'Replace the last commit (fix its message); only before pushing' },
    { cmd: 'git revert <commit>', does: 'Undo a commit by adding a new opposite commit; safe after pushing' },
    { cmd: 'git reset --soft HEAD~1', does: 'Undo the last commit, keep its changes staged' },
    { cmd: 'git reset --hard <commit>', does: 'Move back AND discard all later changes (dangerous)' },
    { cmd: 'git stash', does: 'Park uncommitted changes on a shelf' },
    { cmd: 'git stash pop', does: 'Bring the parked changes back' }
  ],
  sections: [
    { id: 'i4-idea', title: 'Pick the right undo', blocks: [
      { id: 'i4-t1', type: 'text', html: '<p>Git rarely loses saved work, so you can try things without fear. But there are several undo commands and they act on different things: an edit in a file, the staging area, or a <b>commit</b>. The question to ask is always: <b>how far has the mistake travelled?</b></p><ol><li>Only in the file (not staged)?</li><li>Staged, not committed?</li><li>Committed, but only on your computer?</li><li>Committed <em>and pushed</em>, so others may have it?</li></ol>' },
      { id: 'i4-tbl', type: 'table', caption: 'Decision table: keep this one.', head: ['I want to undo…', 'Use…', 'Safe after push?'], rows: [
        ['an unsaved edit in a file', '<code>git restore &lt;file&gt;</code>', 'Not applicable (nothing committed). <b>The edit is lost for good.</b>'],
        ['<code>git add</code> (unstage a file)', '<code>git restore --staged &lt;file&gt;</code>', 'Not applicable (nothing committed)'],
        ['a typo in the last commit message', '<code>git commit --amend -m "…"</code>', '<b>No.</b> Only before pushing'],
        ['a commit I have <em>not</em> pushed (keep the work)', '<code>git reset --soft HEAD~1</code> (or <code>--mixed</code>)', '<b>No.</b> Only before pushing'],
        ['a commit I have <em>not</em> pushed (throw the work away)', '<code>git reset --hard HEAD~1</code>', '<b>No</b>, and it destroys uncommitted work'],
        ['a commit that is <em>already pushed</em>', '<code>git revert &lt;commit&gt;</code>', '<b>Yes.</b> It only adds a commit'],
        ['nothing: I just need a clean folder for a moment', '<code>git stash</code>, later <code>git stash pop</code>', 'Not applicable (stays on your computer)']
      ] },
      { id: 'i4-c1', type: 'callout', kind: 'key', title: 'The golden rule', html: 'If other people may already have a commit, <b>never rewrite it</b> (amend, reset). Add a new commit that fixes it (revert). Rewriting shared history makes their copies disagree with yours.' },
      { id: 'i4-q1b', type: 'question', q: 'i4-q-pushed' }
    ] },
    { id: 'i4-files', title: 'Undo changes before you commit', blocks: [
      { id: 'i4-t2', type: 'text', html: '<p>A file can be in two places: <b>modified</b> in your folder, or <b>staged</b> for the next commit. <code>git restore</code> handles both, and <code>git status</code> always prints the exact command to use.</p>' },
      { id: 'i4-code1', type: 'code', lang: 'bash', code: '$ git status\nChanges to be committed:\n  (use "git restore --staged <file>..." to unstage)\n\tmodified:   notes.md\n\nChanges not staged for commit:\n  (use "git restore <file>..." to discard changes in working directory)\n\tmodified:   chapter1.md' },
      { id: 'i4-c2', type: 'callout', kind: 'warn', title: 'No safety net here', html: '<code>git restore chapter1.md</code> overwrites the file with the last committed version. Edits that were never committed or staged <b>cannot be recovered</b>. Check <code>git diff</code> first if unsure.' },
      { id: 'i4-term1', type: 'interactive', widget: 'terminal', title: 'Unstage one file and discard another edit',
        caption: 'You staged <code>notes.md</code> by mistake, and added a bad line to <code>chapter1.md</code>. Start with <code>git status</code>.',
        config: {
          world: { config: { 'user.name': 'Aino Student', 'user.email': 'aino@example.com', 'init.defaultBranch': 'main' }, cwd: '~/thesis',
            files: { '~/thesis/notes.md': '# Notes\n', '~/thesis/chapter1.md': '# Chapter 1\nIntroduction.\n' },
            run: ['git init', 'git add .', 'git commit -m "Start thesis"', 'echo "draft idea" >> notes.md', 'git add notes.md', 'echo "oops, wrong text" >> chapter1.md'] },
          panels: ['areas'],
          tasks: [
            { id: 'unstage', text: 'Unstage <code>notes.md</code> but keep the edit in the file', hint: 'Use git restore with the --staged option.',
              check: function (w) { var r = w.repo(); return !!r && w.status(r).staged.length === 0 && (w.workTree(r)['notes.md'] || '').indexOf('draft idea') >= 0; }, solution: 'git restore --staged notes.md' },
            { id: 'discard', text: 'Throw away the bad edit in <code>chapter1.md</code> (keep the notes edit)', hint: 'Plain git restore, with the file name.',
              check: function (w) { var r = w.repo(); return !!r && w.workTree(r)['chapter1.md'] === w.headTree(r)['chapter1.md'] && (w.workTree(r)['notes.md'] || '').indexOf('draft idea') >= 0; }, solution: 'git restore chapter1.md' }
          ]
        } },
      { id: 'i4-q2b', type: 'question', q: 'i4-q-restore' }
    ] },
    { id: 'i4-amend', title: 'Fix the last commit (before pushing)', blocks: [
      { id: 'i4-t3', type: 'text', html: '<p>Typo in the message you just wrote? <code>git commit --amend</code> replaces the last <dfn data-term="amend">commit</dfn> with a corrected one. It really creates a new commit with a new id, so only do it while the commit is still <b>only on your computer</b>.</p>' },
      { id: 'i4-code2', type: 'code', lang: 'bash', code: '$ git commit --amend -m "Add chapter 2 outline"\n# Forgot a file? Stage it, then amend and keep the old message:\n$ git add forgotten.md\n$ git commit --amend --no-edit' },
      { id: 'i4-c3', type: 'callout', kind: 'tip', title: 'In this course simulator', html: 'The simulator has no text editor, so write the message with <code>-m</code>. Real Git opens an editor when you leave <code>-m</code> out. In the simulator, <code>--amend</code> without <code>-m</code> keeps the old message.' },
      { id: 'i4-term2', type: 'interactive', widget: 'terminal', title: 'Correct a typo in the last commit message',
        caption: 'Run <code>git log --oneline</code> to see the typo, then fix it.',
        config: {
          world: { config: { 'user.name': 'Aino Student', 'user.email': 'aino@example.com', 'init.defaultBranch': 'main' }, cwd: '~/thesis',
            files: { '~/thesis/chapter1.md': '# Chapter 1\n' },
            run: ['git init', 'git add .', 'git commit -m "Start thesis"', 'echo "# Chapter 2" > chapter2.md', 'git add .', 'git commit -m "Add chaptr 2 outlnie"'] },
          panels: ['graph'],
          tasks: [
            { id: 'amend', text: 'Replace the last commit message with a correct one (for example <em>Add chapter 2 outline</em>) without adding a commit', hint: 'git commit --amend -m "..."',
              check: function (w) { var r = w.repo(), c = r ? w.commitsOn(r) : []; return c.length === 2 && /chapter 2/i.test(c[0].msg) && !/chaptr|outlnie/.test(c[0].msg) && 'chapter2.md' in w.headTree(r); }, solution: 'git commit --amend -m "Add chapter 2 outline"' }
          ]
        } },
      { id: 'i4-q3b', type: 'question', q: 'i4-q-amend' }
    ] },
    { id: 'i4-commits', title: 'Undo commits: revert and reset', blocks: [
      { id: 'i4-t4', type: 'text', html: '<p>Two tools, two meanings. <dfn data-term="revert">Revert</dfn> <b>adds</b> a commit that cancels an old one. History only grows, so it is the safe choice once a commit is pushed. <dfn data-term="reset">Reset</dfn> <b>moves the branch back</b>, as if later commits never happened. That rewrites history, so use it only on commits you have not pushed.</p>' },
      { id: 'i4-h1', type: 'h', text: 'Revert: undo a pushed commit' },
      { id: 'i4-t5', type: 'text', html: '<p>Imagine the last commit, already on GitHub, deleted the bibliography by mistake. Revert it. Real Git opens an editor for the message unless you add <code>--no-edit</code>.</p>' },
      { id: 'i4-term3', type: 'interactive', widget: 'terminal', title: 'Revert a bad commit',
        caption: 'Pretend all three commits are already pushed. Look at <code>git log --oneline</code>, then undo the last one safely.',
        config: {
          world: { config: { 'user.name': 'Aino Student', 'user.email': 'aino@example.com', 'init.defaultBranch': 'main' }, cwd: '~/thesis',
            files: { '~/thesis/chapter1.md': '# Chapter 1\n', '~/thesis/bibliography.md': '# Sources\n- Pro Git\n' },
            run: ['git init', 'git add .', 'git commit -m "Start thesis"', 'echo "# Chapter 2" > chapter2.md', 'git add .', 'git commit -m "Add chapter 2"', 'git rm bibliography.md', 'git commit -m "Tidy up files"'] },
          panels: ['areas', 'graph'],
          tasks: [
            { id: 'revert', text: 'Undo <em>Tidy up files</em> with a revert commit (history must keep all commits)', hint: 'git revert HEAD (add --no-edit in real Git).',
              check: function (w) { var r = w.repo(); if (!r) return false; var c = w.commitsOn(r), t = w.headTree(r); return c.length === 4 && /^Revert/.test(c[0].msg) && 'bibliography.md' in t && 'chapter2.md' in t; }, solution: 'git revert HEAD --no-edit' }
          ]
        } },
      { id: 'i4-h2', type: 'h', text: 'Reset: move back (only before pushing)' },
      { id: 'i4-table2', type: 'table', head: ['Option', 'Commit', 'Staging area', 'Your files'], compact: true, rows: [
        ['<code>--soft</code>', 'undone', 'kept (still staged)', 'kept'],
        ['<code>--mixed</code> (default)', 'undone', 'emptied', 'kept'],
        ['<code>--hard</code>', 'undone', 'emptied', '<b>discarded</b>']
      ] },
      { id: 'i4-t6', type: 'text', html: '<p>The classic use of <code>--soft</code>: you committed too early or with a poor message and want to redo the commit, perhaps with one more file.</p>' },
      { id: 'i4-term4', type: 'interactive', widget: 'terminal', title: 'Reset the last commit and recommit',
        caption: 'The last commit is called "WIP" and was never pushed. Undo it but keep the work, then commit again with a proper message.',
        config: {
          world: { config: { 'user.name': 'Aino Student', 'user.email': 'aino@example.com', 'init.defaultBranch': 'main' }, cwd: '~/thesis',
            files: { '~/thesis/chapter1.md': '# Chapter 1\n' },
            run: ['git init', 'git add .', 'git commit -m "Start thesis"', 'echo "# Chapter 3" > chapter3.md', 'git add .', 'git commit -m "WIP"'] },
          panels: ['areas', 'graph'],
          tasks: [
            { id: 'soft', text: 'Undo the last commit but keep <code>chapter3.md</code> staged', hint: 'HEAD~1 means "one commit before HEAD".',
              check: function (w) { var r = w.repo(); return !!r && w.commitsOn(r).length === 1 && w.status(r).staged.some(function (x) { return x.p === 'chapter3.md'; }); }, solution: 'git reset --soft HEAD~1' },
            { id: 'recommit', text: 'Commit again with the message <em>Add chapter 3 draft</em>', hint: 'git commit -m "..."',
              check: function (w) { var r = w.repo(), c = r ? w.commitsOn(r) : []; return c.length === 2 && c[0].msg === 'Add chapter 3 draft' && 'chapter3.md' in w.headTree(r); }, solution: 'git commit -m "Add chapter 3 draft"' }
          ]
        } },
      { id: 'i4-c4', type: 'callout', kind: 'warn', title: 'Danger zone: reset --hard', html: '<code>git reset --hard</code> deletes every uncommitted edit, and those edits cannot be recovered. Do not run it on commits you pushed: your teammates still have the old ones, and pushing your rewritten branch needs <code>--force</code>, which can erase their work. GitHub can block this with a branch rule.' },
      { id: 'i4-q4b', type: 'question', q: 'i4-q-reset' }
    ] },
    { id: 'i4-stash', title: 'Park work with stash', blocks: [
      { id: 'i4-t7', type: 'text', html: '<p>Sometimes nothing is wrong: you just need a clean folder for a moment, for example to switch branch. <dfn data-term="stash">Stash</dfn> parks your uncommitted changes on a shelf; <code>git stash pop</code> brings them back.</p>' },
      { id: 'i4-term5', type: 'interactive', widget: 'terminal', title: 'Park and restore unfinished work',
        caption: 'You have a half-written edit in <code>notes.md</code>.',
        config: {
          world: { config: { 'user.name': 'Aino Student', 'user.email': 'aino@example.com', 'init.defaultBranch': 'main' }, cwd: '~/thesis',
            files: { '~/thesis/notes.md': '# Notes\n' },
            run: ['git init', 'git add .', 'git commit -m "Start thesis"', 'echo "half-written idea" >> notes.md'] },
          panels: ['areas'],
          tasks: [
            { id: 'stash', text: 'Park the edit: the working folder becomes clean', hint: 'git stash',
              check: function (w) { var r = w.repo(); return !!r && r.stash.length > 0 && w.status(r).clean; }, solution: 'git stash' },
            { id: 'pop', text: 'Bring the edit back', hint: 'git stash pop',
              check: function (w) { var r = w.repo(); return !!r && w.ran(/^git stash (pop|apply)/) && (w.workTree(r)['notes.md'] || '').indexOf('half-written idea') >= 0; }, solution: 'git stash pop' }
          ]
        } },
      { id: 'i4-q5b', type: 'question', q: 'i4-q-order' },
      { id: 'i4-q6b', type: 'question', q: 'i4-q-match' }
    ] },
    { id: 'i4-summary', title: 'Summary', blocks: [
      { id: 'i4-sum', type: 'list', items: [
        'Ask first: how far did the mistake travel (file, staging area, local commit, pushed commit)?',
        '<code>git restore</code> discards edits; <code>git restore --staged</code> only unstages. Discarded edits are gone.',
        '<code>--amend</code> and <code>reset</code> rewrite history: only for commits you have not pushed.',
        '<code>git revert</code> is the safe undo for anything already pushed.',
        '<code>reset --hard</code> also throws away uncommitted work. Use it rarely and on purpose.',
        '<code>git stash</code> parks unfinished work; <code>git stash pop</code> returns it.'
      ] }
    ] }
  ],
  questions: [
    { id: 'i4-q-pushed', type: 'mc', prompt: 'Aino pushed a commit with a wrong figure in the thesis. Teammates have already pulled it. What is the safe fix?',
      options: ['<code>git reset --hard HEAD~1</code> and push again', '<code>git commit --amend</code> and push again', '<code>git revert</code> the commit and push the new commit', 'Delete the repository and start again'],
      answer: 2, hints: ['Which undo only adds history instead of changing it?'],
      explain: '<code>revert</code> adds a new commit, so everyone\'s history still fits together. Reset and amend rewrite history that teammates already have, which forces a conflicting force-push.' },
    { id: 'i4-q-restore', type: 'mc', prompt: 'You edited <code>chapter1.md</code> and ran <code>git add chapter1.md</code>. You want it out of the next commit but keep your edit. Which command?',
      options: ['<code>git restore chapter1.md</code>', '<code>git restore --staged chapter1.md</code>', '<code>git reset --hard</code>', '<code>git revert chapter1.md</code>'],
      answer: 1, hints: ['One option only moves the file out of the staging area.'],
      explain: '<code>--staged</code> unstages and leaves the file content alone. Plain <code>restore</code> on a staged file would not unstage it, and <code>reset --hard</code> would delete your edit.' },
    { id: 'i4-q-amend', type: 'fill', prompt: 'Complete the command to change the message of the last (unpushed) commit.', text: 'git commit [[a]] -m "Correct message"',
      answer: { a: ['--amend'] }, hints: ['The word means "to correct".'], explain: '<code>--amend</code> replaces the last commit with a new, corrected one.' },
    { id: 'i4-q-reset', type: 'multi', prompt: 'Which of these are true about <code>git reset --hard HEAD~1</code>?',
      options: ['It discards uncommitted edits in your files', 'It is safe to use on a commit you already pushed', 'It moves the branch back one commit', 'It adds a new commit that cancels the last one'],
      answer: [0, 2], explain: 'It moves the branch back <em>and</em> overwrites your files. Cancelling a commit with a new commit is <code>revert</code>, not reset.' },
    { id: 'i4-q-order', type: 'order', prompt: 'Put these steps in order to switch to another branch while keeping a half-finished edit.',
      items: ['<code>git stash</code>', '<code>git switch other-branch</code>', 'do the other work, then <code>git switch</code> back', '<code>git stash pop</code>'], explain: 'Park first, switch and work, switch back, then pop. Popping before switching back would carry the edit to the other branch.' },
    { id: 'i4-q-match', type: 'match', prompt: 'Match the situation to the undo.',
      pairs: [['Throw away an unsaved edit', 'git restore file'], ['Unstage a file', 'git restore --staged file'], ['Undo a pushed commit', 'git revert'], ['Redo a local commit, keep the work', 'git reset --soft HEAD~1']], explain: 'Restore acts on files, revert adds a safe opposite commit, soft reset only moves the branch.' }
  ]
});
