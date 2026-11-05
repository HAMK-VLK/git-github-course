/* b3 = A tour of a repository page (github.com simulator, read-only exploring). */
(function () {
  var SLUG = 'hamk-projects/thesis-aino';
  var WORLD = {
    me: 'aino', myName: 'Aino Student', config: { 'user.name': 'Aino Student', 'user.email': 'aino@example.com' },
    users: { teacher: { name: 'Tiina Teacher' }, ben: { name: 'Ben Opiskelija' } },
    orgs: { 'hamk-projects': { displayName: 'HAMK Projects', owners: ['teacher'], members: ['aino', 'ben'], settings: { basePermission: 'read' },
      teams: { 'thesis-2026': { name: 'Thesis 2026', members: ['aino'], repos: { 'hamk-projects/thesis-aino': 'write' } } } } },
    remotes: {
      'hamk-projects/thesis-aino': {
        description: 'Bachelor thesis: version control at HAMK', visibility: 'private',
        commits: [
          { msg: 'Initial commit', author: 'teacher', files: { 'README.md': '# Thesis: Aino Student\n\nSupervisor: Tiina Teacher\n\n## Contents\n- `chapter1.md` introduction\n- `chapter2.md` methods (draft branch)\n' } },
          { msg: 'Add chapter 1 draft', author: 'aino', files: { 'chapter1.md': '# Introduction\n\nVersion control keeps every version of a text.\n' } },
          { msg: 'Fix typos in chapter 1', author: 'ben', files: { 'chapter1.md': '# Introduction\n\nVersion control keeps every version of a text safe.\n' } },
          { msg: 'Add reference list', author: 'aino', files: { 'references.md': '# References\n\n1. Chacon & Straub, Pro Git\n' } }
        ],
        branches: { draft: [{ msg: 'Start chapter 2', author: 'aino', files: { 'chapter2.md': '# Methods\n\nTo be written.\n' } }] },
        issues: [{ title: 'Feedback on chapter 1', body: 'Please expand the motivation.', author: 'teacher', labels: ['feedback'], assignees: ['aino'] }]
      }
    },
    run: []
  };
  function visited(re) { return function (w) { return w.did('visit', function (e) { return re.test(e.path); }); }; }
  function clicked(id) { return function (w) { return w.did('click', function (e) { return e.id === id; }); }; }

  TDC.registerTopic({
    id: 'b3',
    title: 'A tour of a repository page',
    subtitle: 'Every repository on github.com looks the same. Learn where everything is, and you can find your way around any project.',
    audience: 'everyone · no experience needed',
    objectives: [
      'name the parts of a repository page: title, visibility badge, Watch / Fork / Star, tabs',
      'use the branch selector, the file list and the README',
      'find the Code menu and copy the clone URL',
      'open the commit history and see who changed a file last',
      'tell which tabs you see depends on your role'
    ],
    glossary: {
      readme: { term: 'README', def: 'The front page of a repository: a text file called README.md that GitHub shows below the file list.' },
      branch: { term: 'branch', def: 'A separate line of work in a repository. The main one is usually called <code>main</code>.' }
    },
    commands: [],
    sections: [
      { id: 'b3-anatomy', title: 'The top of the page', blocks: [
        { id: 'b3-an-t', type: 'text', html: '<p>A <dfn data-term="repository">repository</dfn> (or "repo") is a project folder with its full history, stored on GitHub. Every repo page has the same layout, so once you know one you know them all. Start at the top.</p>' },
        { id: 'b3-an-tbl', type: 'table', head: ['Part', 'What it tells you'], rows: [
          ['<b>owner / name</b>, e.g. <code>hamk-projects / thesis-aino</code>', 'Who owns the repo (a person or an organization) and the repo name. Click the owner to go to its page.'],
          ['<b>Visibility badge</b> (Public / Private)', 'Who can see it. <b>Private</b> means only people who were given access.'],
          ['<b>Watch</b>', 'Get notifications about activity in the repo.'],
          ['<b>Fork</b>', 'Make your own copy of the repo under your account or organization.'],
          ['<b>Star</b>', 'Bookmark the repo and show appreciation. It changes nothing in the project.']
        ], compact: true },
        { id: 'b3-an-c', type: 'callout', kind: 'info', title: 'In the practice site', html: 'The practice site is a safe copy of github.com. It uses the school organization <code>hamk-projects</code> and you are signed in as <b>aino</b>, a student. Nothing you click here reaches the real GitHub.' },
        { id: 'b3-q-star-blk', type: 'question', q: 'b3-q-star' }
      ] },
      { id: 'b3-code', title: 'The Code tab: branch, files and README', blocks: [
        { id: 'b3-co-t', type: 'text', html: '<p>The <b>Code</b> tab is the home page of the repo. From top to bottom you see:</p>' },
        { id: 'b3-co-l', type: 'list', items: [
          'The <b>branch selector</b> (shows <code>main</code>). A <dfn data-term="branch">branch</dfn> is a separate line of work. Click it to switch to another branch, for example a <code>draft</code> branch where a chapter is still being written.',
          'The <b>file list</b>. Each row shows the file name, the message of the last <dfn data-term="commit">commit</dfn> that changed it, and when.',
          'The <b>latest commit bar</b> above the file list: who saved the newest change, its message, and a <b>Commits</b> link with the total number.',
          'The <b><dfn data-term="readme">README</dfn></b>, shown below the files. It is the project\'s front page: what it is, how to use it, whom to ask.'
        ] },
        { id: 'b3-co-sim', type: 'interactive', widget: 'github', title: 'Switch branch and read the README',
          caption: 'Explore the Code tab of <code>thesis-aino</code>. Nothing here can break.',
          config: { start: '/' + SLUG, personas: ['aino', 'teacher'], terminal: false, world: WORLD,
            tasks: [
              { id: 'readme', text: 'Open <code>README.md</code> from the file list', check: visited(/blob\/main\/README\.md$/), hint: 'Click the file name in the list.', solution: 'Click README.md in the file list.' },
              { id: 'draft', text: 'Switch to the branch <code>draft</code> with the branch selector', check: visited(/tree\/draft/), hint: 'The button with the branch name sits above the file list.', solution: 'Click the branch selector (main ▾), then choose draft. Note the new file chapter2.md.' }
            ] } },
        { id: 'b3-co-c', type: 'callout', kind: 'tip', title: 'Check the branch first', html: 'If a file you expect is missing, look at the branch selector before anything else. You may be on the wrong branch: <code>chapter2.md</code> exists on <code>draft</code> only.' },
        { id: 'b3-q-branch-blk', type: 'question', q: 'b3-q-branch' }
      ] },
      { id: 'b3-codebtn', title: 'The green Code button', blocks: [
        { id: 'b3-cb-t', type: 'text', html: '<p>The green <b>Code</b> button is how you get the project onto your own computer. Its menu has these options:</p>' },
        { id: 'b3-cb-tbl', type: 'table', head: ['Option', 'Use it to'], rows: [
          ['<b>HTTPS</b> URL', 'Copy the web address for <code>git clone</code>. The easy choice: works everywhere.'],
          ['<b>SSH</b> URL', 'Same, but signs in with an SSH key (a later lesson on signing in securely explains keys).'],
          ['<b>GitHub CLI</b>', 'A command for GitHub\'s own command-line tool.'],
          ['<b>Open with GitHub Desktop</b>', 'Clone straight into the GitHub Desktop app.'],
          ['<b>Download ZIP</b>', 'Get a plain copy of the files, without history.']
        ], compact: true },
        { id: 'b3-cb-sim', type: 'interactive', widget: 'github', title: 'Copy the HTTPS clone URL',
          caption: 'Use the green <b>Code</b> button.',
          config: { start: '/' + SLUG, personas: ['aino'], terminal: false, world: WORLD,
            tasks: [
              { id: 'menu', text: 'Open the green <b>Code</b> menu', check: clicked('code-button'), solution: 'Click the green Code button.' },
              { id: 'copy', text: 'Copy the <b>HTTPS</b> URL with the copy button', check: clicked('copy-url-https'), hint: 'HTTPS is the first tab. The copy button is beside the URL.', solution: 'Code → HTTPS tab → click the copy icon next to the URL.' }
            ] } },
        { id: 'b3-q-zip-blk', type: 'question', q: 'b3-q-zip' }
      ] },
      { id: 'b3-history', title: 'History: who changed what', blocks: [
        { id: 'b3-hi-t', type: 'text', html: '<p>The bar above the file list shows the number of commits with a clock icon. Click <b>Commits</b> to open the history: one line per saved change, with message, author and date. The file list also tells you quickly <em>which</em> commit last touched each file: read the message and the date in its row.</p>' },
        { id: 'b3-hi-sim', type: 'interactive', widget: 'github', title: 'Find who changed chapter1.md last',
          caption: 'Compare the commit message in the <code>chapter1.md</code> row with the history, then answer the question below.',
          config: { start: '/' + SLUG, personas: ['aino'], terminal: false, world: WORLD,
            tasks: [
              { id: 'hist', text: 'Open the commit history (the <b>Commits</b> link)', check: clicked('commits-link'), hint: 'Look for the clock icon above the file list.', solution: 'Click "4 Commits" above the file list.' },
              { id: 'file', text: 'Open <code>chapter1.md</code>', check: visited(/blob\/main\/chapter1\.md$/), solution: 'Click chapter1.md in the file list.' }
            ] } },
        { id: 'b3-q-who-blk', type: 'question', q: 'b3-q-who' }
      ] },
      { id: 'b3-tabs', title: 'The tabs', blocks: [
        { id: 'b3-ta-t', type: 'text', html: '<p>The row of tabs under the title opens the other parts of the repo.</p>' },
        { id: 'b3-ta-tbl', type: 'table', head: ['Tab', 'What it is for'], rows: [
          ['<b>Code</b>', 'Files, branches, history (this lesson).'],
          ['<b>Issues</b>', 'To-do items, questions and feedback. Each has a number, e.g. <code>#1</code>.'],
          ['<b>Pull requests</b>', 'Proposed changes waiting for review and merge.'],
          ['<b>Actions</b>', 'Automatic checks and tasks that run when something changes.'],
          ['<b>Projects</b>', 'A board for planning work.'],
          ['<b>Security</b>', 'Security alerts and policy.'],
          ['<b>Insights</b>', 'Statistics: who contributed, activity over time.'],
          ['<b>Settings</b>', 'Access, rules, rename, delete. <b>Only people with enough permission see it</b> (Admin on real GitHub; Maintain sees only part of it).']
        ], compact: true },
        { id: 'b3-ta-sim', type: 'interactive', widget: 'github', title: 'Open Issues, then compare tabs for two people',
          caption: 'Aino is a student with <b>Write</b> access. Use <b>Practise as</b> to switch to the teacher, who owns the organization.',
          config: { start: '/' + SLUG, personas: ['aino', 'teacher'], terminal: false, world: WORLD,
            tasks: [
              { id: 'issues', text: 'Open the <b>Issues</b> tab and see the open issue', check: visited(/\/issues/), solution: 'Click Issues in the tab row.' },
              { id: 'settings', text: 'Switch to <b>teacher</b> (Practise as) and open the <b>Settings</b> tab, which <b>aino</b> does not see', check: function (w) { return w.me === 'teacher' && w.did('visit', function (e) { return /settings$/.test(e.path); }); }, hint: 'Compare the tab rows of the two people.', solution: 'Practise as teacher → click Settings.' }
            ] } },
        { id: 'b3-q-tabs-blk', type: 'question', q: 'b3-q-tabs' }
      ] },
      { id: 'b3-about', title: 'The About sidebar', blocks: [
        { id: 'b3-ab-t', type: 'text', html: '<p>On the right of the Code tab, <b>About</b> gives a one-line description of the project, optional topic tags, links such as <b>Readme</b> and <b>License</b>, and counts of stars and releases. Skim it first: it tells you what the project is before you read a single file. In the practice site it also shows your own role in the repo.</p>' },
        { id: 'b3-ab-c', type: 'callout', kind: 'school', title: 'In the school organization', html: 'Teachers can ask students to write a good description and README in every project repository. Anyone who finds the project later, for example the next student, starts from those two places.' }
      ] },
      { id: 'b3-summary', title: 'Summary', blocks: [
        { id: 'b3-sum', type: 'list', items: [
          'Top: <b>owner / name</b>, visibility badge, <b>Watch</b>, <b>Fork</b>, <b>Star</b>.',
          'Code tab: branch selector, file list with last commit per file, latest-commit bar with the <b>Commits</b> link, README.',
          'Green <b>Code</b> button: HTTPS / SSH / GitHub CLI, Open with GitHub Desktop, Download ZIP (no history).',
          'Tabs: Issues, Pull requests, Actions, Projects, Security, Insights; <b>Settings</b> only with enough permission.',
          '<b>About</b> sidebar: description, topics, links and counts.'
        ] }
      ] }
    ],
    questions: [
      { id: 'b3-q-star', type: 'mc', prompt: 'A colleague <b>stars</b> your repository. What changes in the project?',
        options: ['Nothing: it is a bookmark and a sign of appreciation', 'They can now edit the files', 'They get a copy they can change'], answer: 0, hints: ['Which button makes a copy?'],
        explain: 'A star changes nothing in the project. A <b>Fork</b> makes a copy; access to edit is set in the repository\'s access settings.' },
      { id: 'b3-q-branch', type: 'mc', prompt: 'Aino says <code>chapter2.md</code> has disappeared from the repository. What do you check first?',
        options: ['The branch selector: she may be on a different branch', 'Whether the visibility badge says Private', 'The Star count'], answer: 0, shuffle: false, hints: ['Which control decides which version of the files you see?'],
        explain: 'The file list shows the branch you selected. <code>chapter2.md</code> exists on <code>draft</code>, not on <code>main</code>.' },
      { id: 'b3-q-zip', type: 'multi', prompt: 'Which items are in the green <b>Code</b> menu?',
        options: ['HTTPS and SSH URLs', 'Download ZIP', 'Open with GitHub Desktop', 'Delete repository'], answer: [0, 1, 2], hints: ['Dangerous actions live elsewhere.'],
        explain: 'Deleting a repository is under <b>Settings</b>, not in the Code menu.' },
      { id: 'b3-q-who', type: 'mc', prompt: 'In the practice repository, who made the last change to <code>chapter1.md</code>? (Compare the file row with the history.)',
        options: ['Aino (Add chapter 1 draft)', 'Ben (Fix typos in chapter 1)', 'Tiina (Initial commit)'], answer: 1, shuffle: false, hints: ['The newest commit overall (Add reference list) did not touch this file.'],
        explain: 'The row for <code>chapter1.md</code> shows "Fix typos in chapter 1", made by Ben. The latest commit in the repo is Aino\'s reference list, which touched a different file.' },
      { id: 'b3-q-tabs', type: 'mc', prompt: 'A student opens a project where she has <b>Write</b> access and sees no <b>Settings</b> tab. What does this mean?',
        options: ['The repository is broken', 'Her role is too low to change settings; that is normal', 'Settings is hidden for everyone until it is turned on'], answer: 1, shuffle: false, hints: ['Think about who should be able to delete a repository.'],
        explain: 'GitHub shows Settings only to people with enough permission. Write lets you change files, not the repository itself.' }
    ]
  });
})();
