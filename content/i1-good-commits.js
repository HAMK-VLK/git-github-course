/* i1 = What to commit: good commits and .gitignore (gitignore learn widget + terminal). */
(function () {
  var CFG = { 'user.name': 'Aino Student', 'user.email': 'aino@example.com', 'init.defaultBranch': 'main' };
  var GI_FILES = ['README.md', 'chapters/chapter1.md', 'secrets.env', 'build/thesis.pdf', 'build/figures/plot.png', 'chapter1.aux', 'chapters/chapter2.aux', 'debug.log', 'important.log'];

  // Uses the engine's own matcher, so the lesson and the simulated Git agree.
  function ign(text, p) { var G = TDC.git; return G.isIgnored(G.ignoreRules(text), p); }
  function commits(w) { var r = w.repo(); return r ? w.commitsOn(r) : []; }
  function ranRe(w, re) { return w.log.some(function (l) { return !l.code && re.test(l.cmd); }); }

  TDC.registerTopic({
    id: 'i1',
    title: 'What to commit: good commits and .gitignore',
    subtitle: 'Small, well-named commits, and a list of files Git should never touch.',
    audience: 'after Beginner · you can already commit',
    objectives: [
      'make one logical change per commit',
      'write a commit message with an imperative summary and, when needed, a reason',
      'name what must never be committed: passwords, keys, personal data, build output, huge files',
      'write .gitignore patterns (*.log, build/, !keep, /root-only, **/)',
      'choose Markdown or LaTeX over Word and PDF when you want useful history'
    ],
    glossary: {
      secret: { term: 'secret', def: 'A password, access token, API key or private key. Anyone who has it can act as you or use your services.' }
    },
    commands: [
      { cmd: 'git status -s', does: 'Short status: two letters per file (?? = untracked, A = staged, M = modified)' },
      { cmd: 'git add -p', does: 'Choose which parts of a file go into the next commit (one logical change at a time)' },
      { cmd: 'git rm --cached <file>', does: 'Stop tracking a file but keep it in your folder (then add it to .gitignore)' },
      { cmd: 'git status --ignored', does: 'Also list the files that .gitignore hides' }
    ],
    sections: [
      { id: 'i1-small', title: 'One logical change per commit', blocks: [
        { id: 'i1-small-t', type: 'text', html: '<p>A <dfn data-term="commit">commit</dfn> is a step in your project\'s story. Make each step <b>one idea</b>: "fix the typos in chapter 1" or "add the survey results". Do not mix both in the same commit.</p><p>Small commits pay off later. You can read the history like a table of contents, undo one idea without losing others, and a teacher or teammate can review a commit in a minute.</p>' },
        { id: 'i1-small-tbl', type: 'table', head: ['Too big', 'Better: separate commits'], rows: [
          ['Tuesday\'s work: new chapter 2, typo fixes in chapter 1, new reference list', '1. <code>Add chapter 2 draft</code><br>2. <code>Fix typos in chapter 1</code><br>3. <code>Add reference list</code>'],
          ['Everything in the folder, once a week', 'One commit each time a piece of work is finished and makes sense on its own']
        ] },
        { id: 'i1-small-c', type: 'callout', kind: 'tip', title: 'You edited two things? Stage only one', html: 'Use <code>git add chapter1.md</code> for one file, or <code>git add -p</code> to pick parts of a file. In GitHub Desktop untick the files you want to leave out; in VS Code stage only some files with <b>+</b>. Commit, then stage the rest and commit again.' },
        { id: 'i1-q-small-blk', type: 'question', q: 'i1-q-small' }
      ] },
      { id: 'i1-message', title: 'Writing a commit message', blocks: [
        { id: 'i1-msg-t', type: 'text', html: '<p>A common convention, used by most projects:</p><ul><li>First line: a <b>summary</b> of up to about 50 characters, in the imperative ("Add", "Fix", "Remove"), without a full stop. Read it as "If applied, this commit will <em>add reference list</em>".</li><li>A <b>blank line</b>.</li><li>Optional longer text: <b>why</b> you changed it. The diff already shows <em>what</em> changed.</li></ul>' },
        { id: 'i1-msg-code', type: 'code', lang: 'text', title: 'A commit message with a reason', code: 'Shorten survey to 10 questions\n\nPilot testers needed 25 minutes. The supervisor asked for\nat most 15, so the demographic questions were removed.' },
        { id: 'i1-msg-how', type: 'text', html: '<p>With <code>-m</code> you can give the summary only. To add the longer text, give <code>-m</code> twice (the second one becomes a new paragraph), or run <code>git commit</code> without <code>-m</code> to open your editor. In GitHub Desktop and VS Code, the <b>Description</b> box (Desktop) or a blank line in the message box (VS Code) does the same.</p>' },
        { id: 'i1-msg-tbl', type: 'table', head: ['Weak', 'Better'], rows: [
          ['<code>updates</code>', '<code>Add interview transcript for participant 3</code>'],
          ['<code>Fixed stuff and also added the chapter and some other things.</code>', '<code>Fix figure numbering in chapter 4</code>'],
          ['<code>final_FINAL_v3</code>', '<code>Prepare submission version</code>']
        ], compact: true },
        { id: 'i1-q-msg-blk', type: 'question', q: 'i1-q-msg' }
      ] },
      { id: 'i1-never', title: 'What never to commit', blocks: [
        { id: 'i1-never-t', type: 'text', html: '<p>A repository remembers <b>everything</b>, forever, for everyone who can read it. Deleting a file in a later commit does not remove it from the earlier ones. So think before you commit, not after.</p>' },
        { id: 'i1-never-tbl', type: 'table', head: ['Do not commit', 'Why', 'Instead'], rows: [
          ['Passwords, <dfn data-term="secret">secrets</dfn>, API keys, tokens, <code>.env</code> files, private SSH keys', 'Anyone who can read the repository can use them. Bots scan GitHub for them within minutes.', 'Keep them outside the repository; commit an example file such as <code>.env.example</code> with fake values'],
          ['Personal data: names with grades, student numbers, interview recordings, survey answers with identifiable details', 'Data protection law (GDPR) applies. You cannot easily erase data from history, and a repository may be shared or made public later.', 'Anonymise first, or store the data in the school\'s approved storage and commit only the analysis'],
          ['Build output: <code>build/</code>, <code>dist/</code>, <code>*.aux</code>, <code>node_modules/</code>, compiled PDFs of your own source', 'Anyone can generate them again from the source. They make noisy, huge diffs.', 'List them in <code>.gitignore</code>'],
          ['Huge binary files: videos, raw datasets, disk images', 'Every version stays in the history, so the repository grows and cloning gets slow. GitHub also rejects files over 100 MiB.', 'Store them elsewhere, or use Git LFS (see the Expert level)'],
          ['Machine-specific files: <code>.DS_Store</code>, <code>Thumbs.db</code>, editor settings', 'They are only useful on your computer and cause pointless changes for teammates.', 'List them in <code>.gitignore</code>']
        ] },
        { id: 'i1-never-c', type: 'callout', kind: 'warn', title: 'Committed a password by mistake? Treat it as leaked', html: 'Changing the file and committing again is <b>not enough</b>: the old commit still holds the secret. <b>Revoke it and create a new one</b> (change the password, delete the token) first. Cleaning the history is a second, optional step. If it is a school account or personal data, tell your supervisor or the school\'s IT support (<code>it-admin</code> in our examples).' },
        { id: 'i1-q-never-blk', type: 'question', q: 'i1-q-never' }
      ] },
      { id: 'i1-patterns', title: '.gitignore patterns', blocks: [
        { id: 'i1-pat-t', type: 'text', html: '<p>A <dfn data-term="gitignore">.gitignore</dfn> file is a plain text file in your project folder. Each line is a <b>pattern</b>. Files that match are hidden from <code>git status</code> and skipped by <code>git add .</code>. Commit <code>.gitignore</code> itself so the whole team shares it.</p>' },
        { id: 'i1-pat-tbl', type: 'table', head: ['Pattern', 'Meaning', 'Example matches'], rows: [
          ['<code>*.log</code>', '<code>*</code> = any characters (not <code>/</code>). All files ending in .log, in any folder', '<code>debug.log</code>, <code>logs/run.log</code>'],
          ['<code>build/</code>', 'A trailing <code>/</code> = a folder, and everything inside', '<code>build/thesis.pdf</code>'],
          ['<code>!important.log</code>', '<code>!</code> = exception: keep this one after all (put it <b>after</b> the rule it overrides)', '<code>important.log</code> is tracked again'],
          ['<code>/todo.txt</code>', 'A leading <code>/</code> = only in the project root', '<code>todo.txt</code> but not <code>notes/todo.txt</code>'],
          ['<code>**/temp</code>', '<code>**</code> = any number of folders in between', '<code>temp</code>, <code>a/temp</code>, <code>a/b/temp</code>'],
          ['<code># comment</code>', 'Lines starting with <code>#</code> are notes; blank lines are ignored', '']
        ] },
        { id: 'i1-pat-c1', type: 'callout', kind: 'key', title: '.gitignore only affects files Git does not track yet', html: 'If a file was already committed, adding it to <code>.gitignore</code> changes nothing. First stop tracking it with <code>git rm --cached secrets.env</code> (the file stays on your disk), then commit. It remains in older commits.' },
        { id: 'i1-pat-c2', type: 'callout', kind: 'info', title: 'Simulator note', html: 'Real Git cannot bring back a file with <code>!</code> if a <em>folder</em> above it is ignored (for example <code>build/</code> then <code>!build/keep.txt</code> does not work). The practice below only tests simple rules, so avoid that case.' },
        { id: 'i1-q-pat-blk', type: 'question', q: 'i1-q-pat' },
        { id: 'i1-gi-sim', type: 'interactive', widget: 'gitignore', title: 'Write the rules and watch the files change',
          caption: 'Type patterns on the left, one per line. The list on the right shows what Git would ignore or track.',
          config: {
            files: GI_FILES, start: '# Rules for my thesis\n',
            tasks: [
              { id: 'secret', text: 'Ignore <code>secrets.env</code>', check: function (s) { return !!s.ignored && s.ignored('secrets.env'); }, hint: 'Type the file name on its own line.', solution: 'secrets.env' },
              { id: 'build', text: 'Ignore the whole <code>build/</code> folder, including <code>build/figures/plot.png</code>', check: function (s) { return !!s.ignored && s.ignored('build/thesis.pdf') && s.ignored('build/figures/plot.png'); }, hint: 'A name that ends with / matches a folder.', solution: 'build/' },
              { id: 'aux', text: 'Ignore every <code>*.aux</code> file, also the one in <code>chapters/</code>', check: function (s) { return !!s.ignored && s.ignored('chapter1.aux') && s.ignored('chapters/chapter2.aux'); }, hint: 'Use * for "any name".', solution: '*.aux' },
              { id: 'keep', text: 'Ignore all <code>*.log</code> files <b>except</b> <code>important.log</code>, and keep <code>README.md</code> tracked',
                check: function (s) { return !!s.ignored && s.ignored('debug.log') && !s.ignored('important.log') && !s.ignored('README.md'); },
                hint: 'The exception starts with ! and must come after *.log.', solution: '*.log\n!important.log' }
            ]
          } }
      ] },
      { id: 'i1-practice', title: 'Practice: ignore, then commit', blocks: [
        { id: 'i1-pr-t', type: 'text', html: '<p>Aino\'s thesis folder is already a repository, but nothing is committed yet. It holds source files, a password file and generated files. Write a <code>.gitignore</code> first, check with <code>git status</code>, then make a clean first commit.</p>' },
        { id: 'i1-pr-sim', type: 'interactive', widget: 'terminal', title: 'Create a .gitignore and commit only what belongs',
          caption: 'Hint: <code>echo "line1\\nline2" &gt; .gitignore</code> writes several lines at once. Compare <code>git status</code> before and after.',
          config: {
            world: {
              config: CFG, cwd: '~/thesis',
              files: { '~/thesis/README.md': '# Thesis\nBy Aino.\n', '~/thesis/chapter1.md': '# Chapter 1\n', '~/thesis/secrets.env': 'API_KEY=abc123\n', '~/thesis/build/thesis.pdf': 'PDF-DATA', '~/thesis/chapter1.aux': 'aux-data' },
              run: ['git init']
            },
            panels: ['areas', 'graph'],
            tasks: [
              { id: 'rules', text: 'Write a <code>.gitignore</code> that ignores <code>secrets.env</code>, <code>build/</code> and <code>*.aux</code>',
                check: function (w) { var t = w.readFile('~/thesis/.gitignore'); return t != null && ign(t, 'secrets.env') && ign(t, 'build/thesis.pdf') && ign(t, 'chapter1.aux') && !ign(t, 'README.md') && !ign(t, 'chapter1.md'); },
                hint: 'Three lines: secrets.env, build/ and *.aux.', solution: 'echo "secrets.env\\nbuild/\\n*.aux" > .gitignore' },
              { id: 'status', text: 'Run <code>git status</code> and see that the ignored files have disappeared from the list',
                check: function (w) {
                  var t = w.readFile('~/thesis/.gitignore'); if (!t) return false;
                  var i = -1; w.log.forEach(function (l, k) { if (!l.code && /^(echo[\s\S]*\.gitignore|code|nano)/.test(l.cmd)) i = k; });
                  return i >= 0 && w.log.slice(i + 1).some(function (l) { return !l.code && /^git status/.test(l.cmd); });
                }, solution: 'git status' },
              { id: 'commit', text: 'Stage everything with <code>git add .</code> and commit with a clear message of at most 50 characters. <code>.gitignore</code>, README.md and chapter1.md go in; the ignored files stay out',
                check: function (w) {
                  var r = w.repo(), c = commits(w); if (!r || !c.length) return false;
                  var t = w.headTree(r), first = (c[0].msg || '').split('\n')[0];
                  return t['README.md'] != null && t['chapter1.md'] != null && t['.gitignore'] != null && t['secrets.env'] == null && t['build/thesis.pdf'] == null && t['chapter1.aux'] == null && first.length > 0 && first.length <= 50;
                }, hint: 'If a file you wanted is missing, check .gitignore for a rule that is too broad.', solution: 'git add .  then  git commit -m "Add thesis draft and gitignore"' }
            ]
          } },
        { id: 'i1-pr-c', type: 'callout', kind: 'info', title: 'Simulator note', html: 'Real <code>echo</code> in Git Bash prints <code>\\n</code> literally unless you use <code>echo -e</code>. The practice terminal understands <code>\\n</code> to keep the task short. In real life, open <code>.gitignore</code> in your editor and type one pattern per line.' },
        { id: 'i1-q-add-blk', type: 'question', q: 'i1-q-add' }
      ] },
      { id: 'i1-templates', title: 'Templates and file formats', blocks: [
        { id: 'i1-tpl-t', type: 'text', html: '<p>You do not have to invent your <code>.gitignore</code>. The public repository <b>github/gitignore</b> has ready-made lists for Python, Node, LaTeX, Java, Unity, Word and many more. On github.com you can also pick one in the <b>Add .gitignore</b> drop-down when you create a repository. Copy the one that fits and add your own lines at the bottom.</p>' },        { id: 'i1-fmt-h', type: 'h', text: 'Your document format decides how useful the history is' },
        { id: 'i1-fmt-t', type: 'text', html: '<p>Git compares files line by line. That works very well for plain text and badly for formats that are really zipped or binary.</p>' },
        { id: 'i1-fmt-tbl', type: 'table', head: ['Format', 'History in Git', 'Advice'], rows: [
          ['Markdown (<code>.md</code>), LaTeX (<code>.tex</code>), plain text, CSV, source code', 'Excellent: you see exactly which lines changed, and merges mostly work', 'Best choice for theses, notes and course material you write yourself'],
          ['Word (<code>.docx</code>), Excel, PowerPoint', 'Poor: stored as one binary blob. Git cannot show or merge changes, and two people editing the same file means one version is lost', 'Fine for a final copy or a form. Do not co-write in it through Git'],
          ['PDF, images, video', 'Stored whole every time; large files make the repository grow', 'Commit the final PDF only if it is the deliverable; ignore PDFs that your LaTeX build creates']
        ] },
        { id: 'i1-fmt-c', type: 'callout', kind: 'school', title: 'Thesis tip', html: 'Write the text in Markdown or LaTeX and let a tool produce the PDF for the supervisor. Commit the source, ignore the generated PDF, and attach the final PDF to a release.' },
        { id: 'i1-q-fmt-blk', type: 'question', q: 'i1-q-fmt' }
      ] },
      { id: 'i1-summary', title: 'Summary', blocks: [
        { id: 'i1-sum', type: 'list', items: [
          'One idea per commit. Stage only what belongs together (<code>git add file</code>, <code>git add -p</code>, tick boxes in the apps).',
          'Message: imperative summary up to about 50 characters, a blank line, then the <em>why</em> if it is not obvious.',
          'Never commit secrets, personal data, build output, machine files or huge binaries. A leaked secret must be revoked, not just deleted.',
          '<code>.gitignore</code>: <code>*.log</code>, <code>build/</code>, <code>!keep</code>, <code>/root-only</code>, <code>**/name</code>. It does not affect files that are already tracked (<code>git rm --cached</code>).',
          'Start from the github/gitignore templates. Prefer Markdown or LaTeX over Word for work that Git should track.'
        ] }
      ] }
    ],
    questions: [
      { id: 'i1-q-small', type: 'mc', prompt: 'You fixed typos in chapter 1 and also wrote a new chapter 2 today. How should you commit?',
        options: ['One commit called "work"', 'Two commits: one for the typo fixes, one for chapter 2', 'Wait a week and commit everything together', 'Only commit chapter 2'], answer: 1, shuffle: false,
        hints: ['Think about undoing or reviewing one of the changes later.'],
        explain: 'One logical change per commit lets you read, review and undo each idea separately. Stage the typo files first, commit, then stage chapter 2.' },
      { id: 'i1-q-msg', type: 'mc', prompt: 'Which summary line follows the usual convention?',
        options: ['fixed the bug.', 'Fixes', 'Fix wrong total in budget table', 'I changed the budget table because it was wrong and also some other stuff'], answer: 2, shuffle: false,
        hints: ['Short, imperative, says what the commit does.'],
        explain: 'Start with a verb in the imperative, stay under about 50 characters, and be specific. Put the reason in the body, after a blank line.' },
      { id: 'i1-q-never', type: 'multi', prompt: 'Which of these should <b>not</b> be committed to the thesis repository?',
        options: ['<code>.env</code> with an API key', 'The interview recordings with participants\' names', '<code>chapter1.md</code>', 'The <code>build/</code> folder with generated PDFs', '<code>README.md</code>'], answer: [0, 1, 3],
        explain: 'Secrets and personal data are risky because history is permanent and readable by everyone with access. Build output can be regenerated. Your source text and README belong in the repository.' },
      { id: 'i1-q-leak', type: 'mc', prompt: 'You pushed a commit that contains a GitHub token. What is the first thing to do?',
        options: ['Delete the file and commit again', 'Revoke the token and create a new one', 'Add the file to .gitignore', 'Nothing: the repository is private'], answer: 1, shuffle: false,
        hints: ['Assume someone has already copied it.'],
        explain: 'The old commit still contains the token, and .gitignore does not remove history. Revoke it first so the leaked copy is useless; clean-up comes after.' },
      { id: 'i1-q-pat', type: 'match', prompt: 'Match each .gitignore line to what it does.',
        pairs: [['<code>*.log</code>', 'Ignores every file ending in .log'], ['<code>build/</code>', 'Ignores the build folder and its contents'], ['<code>!important.log</code>', 'Makes an exception, so the file is kept'], ['<code>/todo.txt</code>', 'Matches only the one in the project root']],
        explain: '<code>*</code> is a wildcard, a trailing <code>/</code> marks a folder, <code>!</code> negates an earlier rule and a leading <code>/</code> anchors the pattern to the root.' },
      { id: 'i1-q-add', type: 'mc', prompt: '<code>passwords.txt</code> was committed last week. You add it to <code>.gitignore</code> now. What happens?',
        options: ['Git deletes it from the history', 'Git keeps tracking it, because .gitignore only affects untracked files', 'Git deletes the file from your disk', 'Git refuses the commit'], answer: 1, shuffle: false,
        hints: ['.gitignore is only consulted for files Git is not tracking.'],
        explain: 'You need <code>git rm --cached passwords.txt</code> to stop tracking it, and even then the old commits still contain it.' },
      { id: 'i1-q-fmt', type: 'mc', prompt: 'Two students will write the same report together and want Git to show and merge each other\'s changes. Which format fits best?',
        options: ['Word (.docx)', 'Markdown (.md)', 'PDF', 'A screenshot of the text'], answer: 1, shuffle: false,
        hints: ['Which formats are plain text?'],
        explain: 'Git compares text line by line. Markdown (or LaTeX) shows clear diffs and merges; .docx and PDF are binary to Git.' }
    ]
  });
})();
