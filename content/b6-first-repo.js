/* b6 = Your first repository: the three areas (terminal simulator + GitHub Desktop and VS Code in tabs group 'tool'). */
(function () {
  var CFG = { 'user.name': 'Aino Student', 'user.email': 'aino@example.com', 'init.defaultBranch': 'main' };
  function ranRe(w, re) { return w.log.some(function (l) { return !l.code && re.test(l.cmd); }); }
  function commits(w) { var r = w.repo(); return r ? w.commitsOn(r).length : 0; }

  // Three boxes joined by arrows; only currentColor / CSS variables so it works in light and dark themes.
  var AREAS_SVG = '<svg viewBox="0 0 720 230" xmlns="http://www.w3.org/2000/svg" role="img" font-family="inherit" font-size="15" fill="currentColor">' +
    '<defs><marker id="b6-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker></defs>' +
    '<g fill="none" stroke="currentColor" stroke-width="2">' +
    '<rect x="10" y="40" width="190" height="150" rx="12" fill="var(--surface-2, transparent)"/>' +
    '<rect x="265" y="40" width="190" height="150" rx="12" fill="var(--surface-2, transparent)"/>' +
    '<rect x="520" y="40" width="190" height="150" rx="12" fill="var(--surface-2, transparent)"/>' +
    '<path d="M202,95 H262" marker-end="url(#b6-ah)"/><path d="M457,95 H517" marker-end="url(#b6-ah)"/></g>' +
    '<g text-anchor="middle">' +
    '<text x="105" y="26" font-weight="700">1. Working folder</text><text x="360" y="26" font-weight="700">2. Staging area</text><text x="615" y="26" font-weight="700">3. Repository</text>' +
    '<text x="105" y="95">The files you see</text><text x="105" y="117">and edit</text><text x="105" y="158" font-size="13" opacity=".75">notes.md, outline.md</text>' +
    '<text x="360" y="95">The changes you chose</text><text x="360" y="117">for the next commit</text><text x="360" y="158" font-size="13" opacity=".75">a waiting list</text>' +
    '<text x="615" y="95">The saved snapshots</text><text x="615" y="117">(commits), in .git</text><text x="615" y="158" font-size="13" opacity=".75">the project\'s memory</text>' +
    '<text x="231" y="84" font-weight="700">git add</text><text x="486" y="84" font-weight="700">git commit</text></g></svg>';

  TDC.registerTopic({
    id: 'b6',
    title: 'Your first repository: the three areas',
    subtitle: 'Turn a folder into a repository, then save your first snapshots: edit, stage, commit.',
    audience: 'everyone · no experience needed',
    objectives: [
      'create a repository with git init (or the button in your app)',
      'name the working folder, the staging area and the repository',
      'read git status and tell untracked, modified and staged files apart',
      'stage files with git add and save a snapshot with git commit -m',
      'write a clear commit message'
    ],
    glossary: {
      commit: { term: 'commit', def: 'A saved snapshot of your project at one moment, with a message that says what changed. Commits are the steps of your project\'s history.' },
      staging: { term: 'staging area', def: 'A waiting list of the changes you have chosen for the next commit. It lets you save only some of your edits. Also called the <em>index</em>.' },
      workingfolder: { term: 'working folder', def: 'The normal folder on your computer with the files you open and edit. Also called the <em>working tree</em>.' },
      untracked: { term: 'untracked file', def: 'A file inside the repository folder that Git has never been told to keep. It is not in any commit yet.' }
    },
    commands: [
      { cmd: 'git init', does: 'Turn the current folder into a repository (creates the hidden .git folder)' },
      { cmd: 'git status', does: 'Show which files are untracked, modified or staged' },
      { cmd: 'git add <file>', does: 'Stage one file for the next commit' },
      { cmd: 'git add .', does: 'Stage everything in this folder (new, changed and deleted files)' },
      { cmd: 'git commit -m "message"', does: 'Save the staged changes as a commit' },
      { cmd: 'git commit -am "message"', does: 'Stage all changes to already tracked files and commit (skips untracked files)' }
    ],
    sections: [
      { id: 'b6-what', title: 'A repository is a folder with a memory', blocks: [
        { id: 'b6-what-t', type: 'text', html: '<p>A <dfn data-term="repository">repository</dfn> (or <em>repo</em>) is an ordinary folder that Git keeps a history for. The folder holds your files as usual. Inside it, Git adds one hidden folder called <code>.git</code>: that is the memory where every saved snapshot lives.</p><p>You create a repository once per project. After that, you save snapshots whenever you reach a good moment, for example after finishing a paragraph of your thesis.</p>' },
        { id: 'b6-what-c', type: 'callout', kind: 'key', title: 'Do not touch .git', html: 'The <code>.git</code> folder is Git\'s own filing cabinet. Never edit or delete it by hand: if it is deleted, the project history is gone and the folder is just a normal folder again.' },
        { id: 'b6-what-code', type: 'code', lang: 'bash', title: 'Create a repository in an existing folder', code: '$ cd thesis\n$ git init\nInitialized empty Git repository in /home/aino/thesis/.git/' }
      ] },
      { id: 'b6-areas', title: 'The three areas', blocks: [
        { id: 'b6-areas-t', type: 'text', html: '<p>Git does not save your files the moment you edit them. A change travels through <b>three areas</b>. This is the most important picture in the whole course, so take a moment with it.</p>' },
        { id: 'b6-areas-fig', type: 'figure', svg: AREAS_SVG, alt: 'Three boxes from left to right: working folder, staging area, repository. An arrow labelled git add leads from the working folder to the staging area, and an arrow labelled git commit leads from the staging area to the repository.',
          caption: 'A change moves left to right: you edit it (working folder), choose it (<code>git add</code>), then save it (<code>git commit</code>).' },
        { id: 'b6-areas-tbl', type: 'table', head: ['Area', 'What it is', 'How a file gets there'], rows: [
          ['<dfn data-term="workingfolder">Working folder</dfn>', 'The files you open and edit, as always', 'You create or edit a file and save it'],
          ['<dfn data-term="staging">Staging area</dfn>', 'The changes picked for the next snapshot', '<code>git add</code>'],
          ['Repository', 'The saved snapshots (<dfn data-term="commit">commits</dfn>), kept in <code>.git</code>', '<code>git commit</code>']
        ] },
        { id: 'b6-areas-c', type: 'callout', kind: 'tip', title: 'Think of packing a parcel', html: 'You put the things you want to send on the table (working folder), place the ones you choose into the box (staging area), then close and label the box (commit). The staging step is what lets you send some changes now and leave others for later.' },
        { id: 'b6-q-areas-blk', type: 'question', q: 'b6-q-areas' }
      ] },
      { id: 'b6-walk', title: 'Terminal walk-through', blocks: [
        { id: 'b6-walk-t', type: 'text', html: '<p>Try the whole cycle in the practice terminal. Aino has a <code>thesis</code> folder with two files. Watch the <b>Inside this project folder</b> panel under the terminal: it shows the three areas change as you type.</p>' },
        { id: 'b6-walk-sim', type: 'interactive', widget: 'terminal', title: 'Create a repository and make two commits',
          caption: 'Type commands and press Enter. After each step, look at the panels.',
          config: {
            world: { config: CFG, cwd: '~/thesis', files: { '~/thesis/notes.md': '# Notes\nFirst ideas.\n', '~/thesis/outline.md': '# Outline\n1. Introduction\n' } },
            panels: ['areas', 'graph'],
            tasks: [
              { id: 'init', text: 'Turn the folder into a repository: <code>git init</code>', check: function (w) { return !!w.repo(); }, solution: 'git init' },
              { id: 'status', text: 'Look at the state of things: <code>git status</code>', check: function (w) { return ranRe(w, /^git status/); }, hint: 'Both files are listed as untracked.', solution: 'git status' },
              { id: 'add', text: 'Stage one file: <code>git add notes.md</code>',
                check: function (w) { var r = w.repo(); return !!r && (w.status(r).staged.length > 0 || commits(w) > 0); }, hint: 'Leave outline.md alone for now.', solution: 'git add notes.md' },
              { id: 'commit', text: 'Save the snapshot: <code>git commit -m "Add notes"</code>', check: function (w) { return commits(w) >= 1; }, hint: 'The message goes between quotation marks.', solution: 'git commit -m "Add notes"' },
              { id: 'edit', text: 'Edit a file: <code>echo "More ideas." &gt;&gt; notes.md</code> (adds a line to the end)',
                check: function (w) { return w.readFile('~/thesis/notes.md') !== '# Notes\nFirst ideas.\n'; },
                hint: 'Use two arrows (>>) so the file is added to, not replaced.', solution: 'echo "More ideas." >> notes.md' },
              { id: 'modified', text: 'Run <code>git status</code> again and find <b>modified</b>',
                check: function (w) {
                  var r = w.repo(); if (!r) return false;
                  var i = -1; w.log.forEach(function (l, k) { if (!l.code && /^echo .*>>/.test(l.cmd)) i = k; });
                  return i >= 0 && w.log.slice(i + 1).some(function (l) { return !l.code && /^git status/.test(l.cmd); });
                }, solution: 'git status' },
              { id: 'commit2', text: 'Stage and commit the change as a second commit',
                check: function (w) { var r = w.repo(); return !!r && commits(w) >= 2 && w.headTree(r)['notes.md'] !== '# Notes\nFirst ideas.\n'; },
                hint: 'git add notes.md, then git commit -m "..."', solution: 'git add notes.md, then git commit -m "Add more ideas"' }
            ]
          } },
        { id: 'b6-walk-c', type: 'callout', kind: 'info', title: 'Why did outline.md stay behind?', html: 'It was never staged, so it is not in any commit. It stays <em>untracked</em>: Git sees it but does not keep its history. That is on purpose: you choose what goes into each snapshot.' }
      ] },
      { id: 'b6-gui', title: 'The same in a graphical app', blocks: [
        { id: 'b6-gui-t', type: 'text', html: '<p>The buttons in <b>GitHub Desktop</b> and <b>VS Code</b> do the same as the commands. Pick your tool; the choice is remembered for the whole course.</p>' },
        { id: 'b6-gui-tabs', type: 'tabs', group: 'tool', tabs: [
          { label: 'Terminal', icon: '⌨️', blocks: [
            { id: 'b6-gt-code', type: 'code', lang: 'bash', code: '$ git init\n$ git add notes.md\n$ git commit -m "Add notes"' },
            { id: 'b6-gt-t', type: 'text', html: '<p>You did this in the walk-through above.</p>' }
          ] },
          { label: 'GitHub Desktop', icon: '🖥️', blocks: [
            { id: 'b6-gd-t', type: 'list', steps: true, items: [
              'Choose <b>File → New repository…</b> (or <b>Create a New Repository on your local drive…</b> on the start screen) and give it a name. For a folder that already exists, use <b>File → Add local repository…</b> (or <b>Add an Existing Repository from your local drive…</b> on the start screen) and click the <b>create a repository</b> link when Desktop says the folder is not a repository yet.',
              'On the <b>Changes</b> tab, every edited or new file is listed with a checkbox. Tick the files you want in this snapshot (ticking = staging).',
              'Type a short message in <b>Summary (required)</b>.',
              'Click <b>Commit to main</b>. The commit appears on the <b>History</b> tab.'
            ] },
            { id: 'b6-gd-sim', type: 'interactive', widget: 'gitgui', title: 'Commit in GitHub Desktop',
              caption: 'The <code>minutes</code> repository is open and has two new files. The tick boxes decide what is committed. Notice that Desktop has no separate "add" step: the checkboxes are the staging area.',
              config: {
                skin: 'desktop', panels: ['areas'],
                world: { config: CFG, cwd: '~/Documents/GitHub/minutes', files: { '~/Documents/GitHub/minutes/agenda.md': '# Agenda\n1. Welcome\n', '~/Documents/GitHub/minutes/minutes.md': '# Minutes\n' }, run: ['git init -b main'] },
                tasks: [
                  { id: 'commit', text: 'Untick <code>minutes.md</code>, type a summary and click <b>Commit to main</b>: only <code>agenda.md</code> is saved',
                    check: function (w) { var r = w.repo(); if (!r || !commits(w)) return false; var t = w.headTree(r); return t['agenda.md'] != null && t['minutes.md'] == null; },
                    hint: 'The Commit button stays grey until you type a summary. Unticked files are not staged.', solution: 'Untick minutes.md, type "Add agenda" in Summary (required), click Commit to main.' }
                ] } }
          ] },
          { label: 'VS Code', icon: '🧩', blocks: [
            { id: 'b6-vs-t', type: 'list', steps: true, items: [
              'Open your folder with <b>File → Open Folder…</b>, then open the <b>Source Control</b> view (the branch icon on the left).',
              'Click <b>Initialize Repository</b>.',              'Hover a file under <b>Changes</b> and click <b>+</b> (<b>Stage Changes</b>). The file moves to <b>Staged Changes</b>.',
              'Type a message in the box and click <b>Commit</b>.'
            ] },
            { id: 'b6-vs-sim', type: 'interactive', widget: 'gitgui', title: 'Initialize, stage and commit in VS Code',
              caption: 'The folder <code>thesis</code> is open but is not a repository yet. Follow the steps on the left side.',
              config: {
                skin: 'vscode', folder: '~/thesis', panels: ['areas'],
                world: { config: CFG, cwd: '~/thesis', files: { '~/thesis/notes.md': '# Notes\nFirst ideas.\n', '~/thesis/outline.md': '# Outline\n' } },
                tasks: [
                  { id: 'init', text: 'Click <b>Initialize Repository</b>', check: function (w) { return !!w.repo('~/thesis'); }, solution: 'Source Control view, then Initialize Repository.' },
                  { id: 'stage', text: 'Stage <code>notes.md</code> with <b>+</b> (Stage Changes)',
                    check: function (w) { var r = w.repo('~/thesis'); return !!r && (w.status(r).staged.length > 0 || commits(w) > 0); }, hint: 'Hover the file name in the Changes list to see the +.', solution: 'Hover notes.md under Changes, click +.' },
                  { id: 'commit', text: 'Type a message and click <b>Commit</b>', check: function (w) { return commits(w) >= 1; }, solution: 'Type "Add notes" in the message box, then click Commit.' }
                ] } }
          ] }
        ] },
        { id: 'b6-q-gui-blk', type: 'question', q: 'b6-q-gui' }
      ] },
      { id: 'b6-status', title: 'Reading git status', blocks: [
        { id: 'b6-status-t', type: 'text', html: '<p><code>git status</code> is the command you will use most. It tells you where every file is among the three areas. Run it whenever you are unsure; it never changes anything.</p>' },
        { id: 'b6-status-code', type: 'code', lang: 'bash', code: '$ git status\nOn branch main\nChanges to be committed:\n  (use "git restore --staged <file>..." to unstage)\n\tnew file:   notes.md\n\nChanges not staged for commit:\n  (use "git add <file>..." to update what will be committed)\n\tmodified:   outline.md\n\nUntracked files:\n  (use "git add <file>..." to include in what will be committed)\n\tchapter1.md' },
        { id: 'b6-status-tbl', type: 'table', head: ['status says', 'Meaning', 'Area'], rows: [
          ['<code>Untracked files</code>', 'New file Git has never been told to keep', 'Working folder'],
          ['<code>Changes not staged for commit</code> (<code>modified</code>)', 'A kept file that you edited', 'Working folder'],
          ['<code>Changes to be committed</code>', 'Chosen for the next commit', 'Staging area'],
          ['<code>nothing to commit, working tree clean</code>', 'Everything is saved', 'All three agree']
        ] },
        { id: 'b6-q-status-blk', type: 'question', q: 'b6-q-status' },
        { id: 'b6-addall-t', type: 'text', html: '<h4>Shortcuts</h4><ul><li><code>git add .</code> stages everything in the folder (the dot means "here"). Run <code>git status</code> first so you know what you are about to include.</li><li><code>git commit -am "message"</code> stages and commits every change to files Git already tracks in one go.</li></ul>' },
        { id: 'b6-caveat', type: 'callout', kind: 'warn', title: 'commit -a skips new files', html: '<code>git commit -a</code> only picks up files that are already tracked. A brand-new (untracked) file is silently left out. Use <code>git add</code> for new files first.' },
        { id: 'b6-msg-h', type: 'h', text: 'Writing a good commit message' },
        { id: 'b6-msg-t', type: 'text', html: '<p>The message is a note to your future self (and your teammates). Say <em>what</em> the snapshot contains, in a short sentence that starts with a verb.</p>' },
        { id: 'b6-msg-tbl', type: 'table', head: ['Weak', 'Better'], rows: [
          ['<code>stuff</code>', '<code>Add survey questions to chapter 2</code>'],
          ['<code>changes</code>', '<code>Fix typos in the introduction</code>'],
          ['<code>final version!!</code>', '<code>Add reference list</code>']
        ], compact: true },
        { id: 'b6-q-msg-blk', type: 'question', q: 'b6-q-msg' }
      ] },
      { id: 'b6-summary', title: 'Summary', blocks: [
        { id: 'b6-sum', type: 'list', items: [
          'A repository is a folder plus a hidden <code>.git</code> folder; <code>git init</code> creates it.',
          'Changes move through three areas: working folder, <code>git add</code> to the staging area, <code>git commit</code> to the repository.',
          '<code>git status</code> shows what is untracked, modified or staged. It is safe to run any time.',
          '<code>git add .</code> stages everything; <code>git commit -a</code> skips untracked files.',
          'Write commit messages that say what changed, starting with a verb.'
        ] }
      ] }
    ],
    questions: [
      { id: 'b6-q-areas', type: 'order', prompt: 'Put the journey of an edited file in order.',
        items: ['Edit and save the file in the working folder', '<code>git add</code> moves the change to the staging area', '<code>git commit</code> saves it in the repository'], explain: 'Edit, choose (stage), save (commit).' },
      { id: 'b6-q-status', type: 'mc', prompt: 'You created <code>notes.md</code> and have not run any Git command on it. Where does <code>git status</code> list it?',
        options: ['Untracked files', 'Changes to be committed', 'Nowhere, Git ignores it', 'It is already committed'], answer: 0, shuffle: false, hints: ['Git has not been told to keep it yet.'],
        explain: 'A new file Git has never seen is untracked. After <code>git add</code> it moves to "Changes to be committed".' },
      { id: 'b6-q-commita', type: 'mc', prompt: 'You made a new file <code>new.md</code> and edited the tracked <code>old.md</code>. What does <code>git commit -am "Update"</code> save?',
        options: ['Both files', 'Only old.md', 'Only new.md', 'Nothing'], answer: 1, shuffle: false, hints: ['-a only works on files Git already tracks.'],
        explain: '<code>-a</code> stages changes to tracked files only, so <code>new.md</code> stays untracked.' },
      { id: 'b6-q-fill', type: 'fill', prompt: 'Complete the commands to stage everything and commit it.', text: 'git [[a]] .\ngit commit [[b]] "Add survey"',
        answer: { a: ['add'], b: ['-m'] }, explain: '<code>git add .</code> stages all changes, and <code>-m</code> lets you give the message on the command line.' },
      { id: 'b6-q-msg', type: 'mc', prompt: 'Which commit message is the most useful?',
        options: ['update', 'asdf', 'Add interview questions to chapter 3', 'final final v2'], answer: 2, shuffle: false, hints: ['A good message says what the snapshot contains.'],
        explain: 'A short sentence starting with a verb tells you later what the commit did.' },
      { id: 'b6-q-gui', type: 'match', prompt: 'Match the app step to the Git idea.',
        pairs: [['VS Code: click + (Stage Changes)', 'git add'], ['GitHub Desktop: tick the checkbox of a file', 'git add'], ['Click Commit to main / Commit', 'git commit'], ['VS Code: Initialize Repository', 'git init']],
        explain: 'The apps use buttons, but each one runs the same command underneath.' },
      { id: 'b6-q-multi', type: 'multi', prompt: 'Which of these are true?',
        options: ['The hidden <code>.git</code> folder holds the history', '<code>git status</code> changes your files', 'You can commit only some of your edited files', 'Saving a file in your editor creates a commit'], answer: [0, 2],
        explain: 'Staging lets you pick what goes in a commit. <code>git status</code> only reads, and saving a file never commits by itself.' }
    ]
  });
})();
