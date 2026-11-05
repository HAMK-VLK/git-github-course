/* b4 = Working in the browser: upload, edit, commit (github.com simulator, no installation needed). */
(function () {
  var SLUG = 'hamk-projects/department-minutes';
  var README0 = '# Department minutes\n\nMeeting minutes of the Digital Learning department.\n\n## Contents\n- `minutes/` approved minutes\n';
  function tree(w) { var r = w.server.repos[SLUG]; return r ? w.commit(r.refs.main).tree : {}; }
  function has(w, name) { return Object.keys(tree(w)).some(function (p) { return p.split('/').pop() === name; }); }

  var WORLD = {
    me: 'marja', myName: 'Marja Virtanen', config: { 'user.name': 'Marja Virtanen', 'user.email': 'marja@example.com' },
    users: { teacher: { name: 'Tiina Teacher' } },
    orgs: { 'hamk-projects': { displayName: 'HAMK Projects', owners: ['teacher'], members: ['marja'], settings: { basePermission: 'read' }, teams: {} } },
    remotes: {
      'hamk-projects/department-minutes': {
        description: 'Minutes of the Digital Learning department', collaborators: { marja: 'write' },
        commits: [
          { msg: 'Initial commit', author: 'teacher', files: { 'README.md': README0 } },
          { msg: 'Add minutes of 2026-09-02', author: 'teacher', files: { 'minutes/2026-09-02.md': '# Minutes 2 September 2026\n\nPresent: Tiina, Marja\n' } },
          { msg: 'Add minutes of 2026-10-07', author: 'marja', files: { 'minutes/2026-10-07.md': '# Minutes 7 October 2026\n\nDecision: new course template.\n' } }
        ]
      }
    },
    run: []
  };

  TDC.registerTopic({
    id: 'b4',
    title: 'Working in the browser: upload, edit, commit',
    subtitle: 'No installation needed: upload files, edit text, write a commit message and look at the history, all on github.com.',
    audience: 'staff and everyone who will never install anything',
    objectives: [
      'upload one or more files to a repository from the browser',
      'edit a text file with the pencil and check it with Preview',
      'create a new file inside a new folder',
      'write a clear commit message and choose between committing directly and a new branch',
      'open the history and see an earlier version of a file'
    ],
    glossary: {
      readme: { term: 'README', def: 'The front page of a repository: a text file called README.md that GitHub shows below the file list.' },
      markdown: { term: 'Markdown', def: 'A way of writing formatted text in a plain file (for example <code># Title</code> for a heading). Files ending in <code>.md</code> use it.' }
    },
    commands: [],
    sections: [
      { id: 'b4-when', title: 'When the browser is enough', blocks: [
        { id: 'b4-when-t', type: 'text', html: '<p>You do not need to install anything to work with a <dfn data-term="repository">repository</dfn>. github.com lets you upload files, edit text and see the history in an ordinary web browser. For many staff tasks, for example depositing meeting minutes or fixing a typo in a guide, this is all you ever need.</p>' },
        { id: 'b4-when-tbl', type: 'table', head: ['Good for the browser', 'Better with an app or Git'], rows: [
          ['Adding a few documents (minutes, agendas, PDFs)', 'Hundreds of files or whole folders at once'],
          ['Fixing a typo or updating a text page', 'Working offline, on a train or without Wi-Fi'],
          ['Reading the history of a document', 'Large files (over 25 MB each in the browser)']        ], compact: true },
        { id: 'b4-when-c', type: 'callout', kind: 'warn', title: '"Download ZIP" has no history', html: 'The <b>Code → Download ZIP</b> button gives you a plain copy of the current files. The history stays on GitHub: the ZIP contains no commits and cannot be sent back. To get a copy that can also be updated later you need a clone (lesson 1.8).' },
        { id: 'b4-q-zip-blk', type: 'question', q: 'b4-q-zip' }
      ] },
      { id: 'b4-upload', title: 'Upload files', blocks: [
        { id: 'b4-up-t', type: 'text', html: '<p>The repository <code>hamk-projects/department-minutes</code> keeps the minutes of the Digital Learning department. You are signed in as <b>marja</b>, and you have <b>Write</b> access, so you may add files. Uploading is a four-step routine:</p>' },
        { id: 'b4-up-steps', type: 'list', steps: true, items: [
          'On the repository page, click <b>Add file</b> and choose <b>Upload files</b>.',
          'Click <b>choose your files</b> (or drag files into the box) and pick the files from your computer. They are listed under the box.',
          'Write a short message that says what you added, for example <code>Add minutes and agenda of 4 November</code>. This is the <dfn data-term="commit">commit</dfn> message.',
          'Click <b>Commit changes…</b>, check that <b>Commit directly to the main branch</b> is selected, and click <b>Commit changes</b> in the window.'
        ] },
        { id: 'b4-up-c', type: 'callout', kind: 'info', title: 'Limits', html: 'A single file may be at most 25 MB when uploaded through the browser, and you cannot upload an empty folder. To add a whole folder, drag it into the box. In the practice site, <b>choose your files</b> opens a pretend file picker with a few files.' },        { id: 'b4-up-sim', type: 'interactive', widget: 'github', title: 'Upload two files with a commit message',
          caption: 'Follow the steps above. The <b>choose your files</b> button opens a pretend file picker.',
          config: {
            start: '/hamk-projects/department-minutes', personas: ['marja'], terminal: false,
            uploads: { 'minutes-2026-11-04.docx': '(pretend Word document)\n', 'agenda.pdf': '%PDF-1.7 (pretend PDF)\n', 'holiday-photo.jpg': '(pretend image)\n' },
            world: WORLD,
            tasks: [
              { id: 'menu', text: 'Click <b>Add file</b> and choose <b>Upload files</b>', check: function (w) { return w.did('click', function (e) { return e.id === 'upload-files'; }); }, solution: 'Add file ▾ → Upload files' },
              { id: 'up', text: 'Upload <code>minutes-2026-11-04.docx</code> and <code>agenda.pdf</code> in one commit with your own message',
                check: function (w) { return has(w, 'minutes-2026-11-04.docx') && has(w, 'agenda.pdf'); },
                hint: 'Tick both files in the picker, click Open, then Commit changes… and Commit changes again.', solution: 'choose your files → tick both → Open → type a message → Commit changes… → Commit changes' }
            ] } },
        { id: 'b4-q-up-blk', type: 'question', q: 'b4-q-up' }
      ] },
      { id: 'b4-edit', title: 'Edit a text file', blocks: [
        { id: 'b4-ed-t', type: 'text', html: '<p>Text files such as <code>README.md</code> can be changed directly on the page. A file ending in <code>.md</code> is written in <dfn data-term="markdown">Markdown</dfn>: plain text where <code># Title</code> makes a heading and <code>- item</code> makes a bullet.</p>' },
        { id: 'b4-ed-steps', type: 'list', steps: true, items: [
          'Click the file name in the file list to open it.',
          'Click the pencil <b>✎</b> (<b>Edit this file</b>) at the top right of the file.',
          'Type your change in the box. Click <b>Preview</b> to see how it will look, and <b>Edit</b> to go back.',
          'Click <b>Commit changes…</b>. GitHub proposes a message such as <code>Update README.md</code>: replace it with something more specific, then click <b>Commit changes</b>.'
        ] },
        { id: 'b4-ed-c', type: 'callout', kind: 'tip', title: 'Directly or new branch?', html: 'The window offers <b>Commit directly to the main branch</b> or <b>Create a new branch for this commit and start a pull request</b>. For a small fix in your own area, commit directly. Use the new branch when someone else should review the change first: you will meet branches and pull requests in later lessons. If the main branch is protected, GitHub forces the second choice.' },
        { id: 'b4-q-direct-blk', type: 'question', q: 'b4-q-direct' }
      ] },
      { id: 'b4-new', title: 'Create a new file and a folder', blocks: [
        { id: 'b4-new-t', type: 'text', html: '<p>GitHub has no "New folder" button. A folder exists as soon as a file is inside it, so you create the folder by <b>typing it into the file name</b>: type a slash <code>/</code> and the folder name turns into a folder.</p>' },
        { id: 'b4-new-steps', type: 'list', steps: true, items: [
          'Click <b>Add file</b> and choose <b>Create new file</b>.',
          'In the <b>Name your file…</b> box type <code>docs/minutes-2026-11.md</code>. When you type the <code>/</code>, <code>docs</code> becomes a folder.',
          'Write the content in the big box, for example a heading and a few lines.',
          'Click <b>Commit changes…</b>, write a message and click <b>Commit changes</b>.'
        ] },
        { id: 'b4-new-sim', type: 'interactive', widget: 'github', title: 'Edit the README, then create a file in a new folder',
          caption: 'Same repository. Use the pencil on <code>README.md</code> first, then <b>Add file → Create new file</b>.',
          config: {
            start: '/hamk-projects/department-minutes', personas: ['marja'], terminal: false, world: WORLD,
            tasks: [
              { id: 'readme', text: 'Open <code>README.md</code>, click the pencil <b>✎</b>, add a line of your own and commit it',
                check: function (w) { return tree(w)['README.md'] !== README0; }, hint: 'Click the file name first, then the pencil at the top right of the file.', solution: 'README.md → ✎ → type a new line → Commit changes… → Commit changes' },
              { id: 'preview', text: 'Use <b>Preview</b> while editing a file', check: function (w) { return w.did('click', function (e) { return e.id === 'preview'; }); }, hint: 'Preview sits next to Edit above the text box.', solution: 'In the editor, click Preview.' },
              { id: 'newfile', text: 'Create <code>docs/minutes-2026-11.md</code> with some text and commit it',
                check: function (w) { return tree(w)['docs/minutes-2026-11.md'] != null; }, hint: 'Type the whole path in the name box, including docs/.', solution: 'Add file → Create new file → name docs/minutes-2026-11.md → write text → Commit changes…' }
            ] } },
        { id: 'b4-q-folder-blk', type: 'question', q: 'b4-q-folder' }
      ] },
      { id: 'b4-history', title: 'See an old version', blocks: [
        { id: 'b4-hi-t', type: 'text', html: '<p>Every commit you make is kept. Nothing you upload or edit is lost, even if you later change it. That is why the message matters: it is how you find a version again.</p>' },
        { id: 'b4-hi-steps', type: 'list', steps: true, items: [
          'On the repository page click the <b>Commits</b> link with the clock icon (it shows the number of commits). For one file, open it and click <b>History</b>.',
          'Each line is a commit: message, author and date. Click a message to see exactly which lines changed (green = added, red = removed).',
          'To see or restore an old version of a file, open the commit, open the file as it was then, copy the old text and paste it into a new edit with the pencil, then commit.'
        ] },        { id: 'b4-hi-sim', type: 'interactive', widget: 'github', title: 'Open the history',
          caption: 'The repository has three earlier commits.',
          config: {
            start: '/hamk-projects/department-minutes', personas: ['marja'], terminal: false, world: WORLD,
            tasks: [
              { id: 'hist', text: 'Open the commit history from the repository page',
                check: function (w) { return w.did('visit', function (e) { return /\/commits\//.test(e.path); }); }, hint: 'Look for the clock icon and the number of commits.', solution: 'Click the "3 Commits" link.' },
              { id: 'one', text: 'Click one commit message and look at the changes it made',
                check: function (w) { return w.did('visit', function (e) { return /\/commit\/[0-9a-f]+/.test(e.path); }); }, solution: 'In the list, click a commit message.' }
            ] } },
        { id: 'b4-q-hist-blk', type: 'question', q: 'b4-q-hist' }
      ] },
      { id: 'b4-summary', title: 'Summary', blocks: [
        { id: 'b4-sum', type: 'list', items: [
          'The browser is enough for adding a few files and editing text: nothing to install.',
          'Upload: <b>Add file → Upload files → choose your files → Commit changes…</b>. A file can be at most 25 MB.',
          'Edit: open the file, click the pencil ✎, use <b>Preview</b>, then <b>Commit changes…</b>.',
          'A folder is created by typing <code>folder/name.md</code> in <b>Create new file</b>.',
          'Write specific commit messages; the history keeps every version. A ZIP download has no history.'
        ] }
      ] }
    ],
    questions: [
      { id: 'b4-q-zip', type: 'mc', prompt: 'A colleague downloads the repository with <b>Code → Download ZIP</b>. What does the ZIP contain?',
        options: ['The current files only, without history', 'The files and every earlier version', 'Only the README'], answer: 0, shuffle: false, hints: ['Think of the ZIP as a photocopy.'],
        explain: 'A ZIP is a plain copy of the current files. The history stays on GitHub.' },
      { id: 'b4-q-up', type: 'order', prompt: 'Put the upload steps in order.',
        items: ['Click <b>Add file</b> and <b>Upload files</b>', 'Click <b>choose your files</b> and pick them', 'Write a commit message', 'Click <b>Commit changes</b>'],
        explain: 'Pick the files first, then describe them, then commit.' },
      { id: 'b4-q-direct', type: 'mc', prompt: 'You may edit <code>README.md</code> directly, but the director wants to read changes first. What do you choose in the commit window?',
        options: ['Commit directly to the main branch', 'Create a new branch for this commit and start a pull request', 'Cancel and email the file'], answer: 1, shuffle: false, hints: ['Which option leaves main untouched until someone agrees?'],
        explain: 'A new branch keeps <code>main</code> unchanged until the change is reviewed and accepted.' },
      { id: 'b4-q-folder', type: 'fill', prompt: 'You want a new file <code>notes.md</code> inside a new folder <code>docs</code>. What do you type in the name box?', text: '[[a]]',
        answer: { a: ['docs/notes.md'] }, explain: 'Typing the slash turns <code>docs</code> into a folder; GitHub has no separate New folder button.' },
      { id: 'b4-q-hist', type: 'multi', prompt: 'Which of these are true?',
        options: ['Every commit is kept in the history', 'A better commit message makes an old version easier to find', 'After an edit, the old version is gone', 'You can see exactly what changed in a commit'], answer: [0, 1, 3],
        explain: 'GitHub keeps all commits, so the old text is still there.' }
    ]
  });
})();
