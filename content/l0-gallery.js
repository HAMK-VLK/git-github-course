/* l0 = component gallery / authoring template (hidden from the home page; open #/topic/l0).
 * Lesson writers: copy patterns from here. Ids must be unique and must never be renamed. */
TDC.registerTopic({
  id: 'l0',
  title: 'Component gallery (template)',
  subtitle: 'Every block, question and simulator type in one place.',
  audience: 'course authors',
  objectives: ['see how each block type looks', 'try every simulator'],
  glossary: { repository: { term: 'repository (repo)', def: 'A project folder whose full history Git keeps, in a hidden <code>.git</code> folder.' } },
  commands: [{ cmd: 'git status', does: 'Show what changed since the last commit' }],
  sections: [
    { id: 'l0-text', title: 'Text, callouts, code', blocks: [
      { id: 'l0-t1', type: 'text', html: '<p>Plain HTML. Glossary terms: <dfn data-term="repository">repository</dfn>. Keys: <kbd>Ctrl</kbd>+<kbd>S</kbd>. Code: <code>git status</code>.</p>' },
      { id: 'l0-c1', type: 'callout', kind: 'key', title: 'Key idea', html: 'A commit is a saved snapshot of the whole project.' },
      { id: 'l0-c2', type: 'callout', kind: 'school', title: 'At HAMK', html: 'School projects live in the school organization.' },
      { id: 'l0-c3', type: 'callout', kind: 'warn', html: 'Never commit passwords.' },
      { id: 'l0-code1', type: 'code', lang: 'bash', code: '$ git status\nOn branch main\nnothing to commit, working tree clean' },
      { id: 'l0-tabs', type: 'tabs', group: 'os', tabs: [
        { label: 'Windows', icon: '🪟', blocks: [{ id: 'l0-tw', type: 'text', html: '<p>Windows steps.</p>' }] },
        { label: 'macOS', icon: '🍎', blocks: [{ id: 'l0-tm', type: 'text', html: '<p>macOS steps.</p>' }] }
      ] },
      { id: 'l0-ex', type: 'example', title: 'Save a first version', problem: 'Aino wants to save her notes.', steps: ['Open the folder.', { code: '$ git init', lang: 'bash' }, 'Done.'], result: 'Her first commit exists.' },
      { id: 'l0-q1', type: 'question', q: 'l0-q-mc' }
    ] },
    { id: 'l0-term', title: 'Terminal simulator', blocks: [
      { id: 'l0-term1', type: 'interactive', widget: 'terminal', title: 'Make your first commit',
        caption: 'Type commands and press Enter. ↑ repeats earlier commands, Tab completes names.',
        config: {
          world: { config: { 'user.name': 'Aino Student', 'user.email': 'aino@example.com', 'init.defaultBranch': 'main' }, cwd: '~/thesis', files: { '~/thesis/notes.md': '# My thesis notes\n' } },
          panels: ['areas', 'graph'],
          tasks: [
            { id: 'init', text: 'Turn the folder into a repository: <code>git init</code>', check: function (w) { return !!w.repo(); }, solution: 'git init' },
            { id: 'add', text: 'Stage <code>notes.md</code>', check: function (w) { var r = w.repo(); return !!r && ('notes.md' in r.index || w.commitsOn(r).length > 0); }, solution: 'git add notes.md' },
            { id: 'commit', text: 'Commit it with a message', check: function (w) { return w.commitsOn(w.repo()).length > 0; }, hint: 'Use -m "message".', solution: 'git commit -m "Add notes"' }
          ]
        } }
    ] }
    ,
    { id: 'l0-gui', title: 'GitHub Desktop and VS Code', blocks: [
      { id: 'l0-desk', type: 'interactive', widget: 'gitgui', title: 'Commit and push with GitHub Desktop',
        config: {
          skin: 'desktop', panels: ['graph'],
          world: { me: 'aino', config: { 'user.name': 'Aino Student', 'user.email': 'aino@example.com', 'init.defaultBranch': 'main' },
            orgs: { 'hamk-projects': { owners: ['teacher'], members: ['aino'] } },
            remotes: { 'hamk-projects/course-notes': { collaborators: { aino: 'write' }, commits: [{ msg: 'Initial commit', author: 'teacher', files: { 'README.md': '# Course notes\n', 'week1.md': '# Week 1\n' } }] } },
            run: ['git clone https://github.com/hamk-projects/course-notes.git'], cwd: '~' },
          tasks: [
            { id: 'edit', text: 'Edit <code>week1.md</code> in your text editor and save', check: function (w) { var r = w.repo('~/course-notes'); return !!r && w.readFile('~/course-notes/week1.md') !== '# Week 1\n'; } },
            { id: 'commit', text: 'Commit it with a summary', check: function (w) { var r = w.repo('~/course-notes'); return !!r && w.commitsOn(r).length > 1; } },
            { id: 'push', text: 'Push origin', check: function (w) { var r = w.repo('~/course-notes'); return !!r && w.commitsOn(r).length > 1 && w.server.repos['hamk-projects/course-notes'].refs.main === r.heads.main; } }
          ] } },
      { id: 'l0-vs', type: 'interactive', widget: 'gitgui', title: 'Stage and commit in VS Code',
        config: {
          skin: 'vscode', folder: '~/thesis',
          world: { config: { 'user.name': 'Aino Student', 'user.email': 'aino@example.com', 'init.defaultBranch': 'main' }, files: { '~/thesis/notes.md': '# Notes\n' }, cwd: '~/thesis' },
          tasks: [
            { id: 'init', text: 'Initialize Repository', check: function (w) { return !!w.repo('~/thesis'); } },
            { id: 'commit', text: 'Stage <code>notes.md</code> and commit it', check: function (w) { var r = w.repo('~/thesis'); return !!r && w.commitsOn(r).length > 0; } }
          ] } }
    ] },
    { id: 'l0-gh', title: 'GitHub web simulator', blocks: [
      { id: 'l0-gh1', type: 'interactive', widget: 'github', title: 'Explore a school repository and its permissions',
        config: {
          start: '/hamk-projects/thesis-aino', personas: ['aino', 'teacher', 'ben'], terminal: true,
          world: { me: 'aino', myName: 'Aino Student', config: { 'user.name': 'Aino Student', 'user.email': 'aino@example.com' },
            users: { teacher: { name: 'Tiina Teacher' }, ben: { name: 'Ben Opiskelija' } },
            orgs: { 'hamk-projects': { displayName: 'HAMK Projects', owners: ['teacher'], members: ['aino', 'ben'], settings: { basePermission: 'read' },
              teams: { 'thesis-2026': { name: 'Thesis 2026', members: ['aino'], repos: { 'hamk-projects/thesis-aino': 'write' } } } } },
            remotes: { 'hamk-projects/thesis-aino': { description: 'Bachelor thesis: version control at HAMK', commits: [
              { msg: 'Initial commit', author: 'teacher', files: { 'README.md': '# Thesis: Aino Student\n\nSupervisor: @teacher\n\n## Structure\n- `chapters/` text\n- `figures/` images\n' } },
              { msg: 'Add chapter 1 draft', author: 'aino', files: { 'chapters/01-intro.md': '# Introduction\n\nVersion control keeps...\n' } }],
              branches: { draft: [{ msg: 'Start chapter 2', author: 'aino', files: { 'chapters/02-methods.md': '# Methods\n' } }] },
              issues: [{ title: 'Feedback on chapter 1', body: 'Please expand the motivation. @aino', author: 'teacher', labels: ['feedback'], assignees: ['aino'] }] } },
            run: [] },
          tasks: [
            { id: 'code', text: 'Open the green <b>Code</b> button', check: function (w) { return w.did('click', function (e) { return e.id === 'code-button'; }); } },
            { id: 'issue', text: 'Open the <b>Issues</b> tab', check: function (w) { return w.did('visit', function (e) { return /\/issues/.test(e.path); }); } },
            { id: 'delete', text: 'As <b>aino</b>, try to delete the repository (Settings is missing: why?) — then switch to <b>teacher</b> and find the Danger Zone', check: function (w) { return w.did('visit', function (e) { return /settings$/.test(e.path); }) && w.me === 'teacher'; } }
          ] } }
    ] }
  ],
  questions: [
    { id: 'l0-q-mc', type: 'mc', prompt: 'Which command shows what changed?', options: ['git status', 'git init', 'git clone'], answer: 0, explain: '<code>git status</code> lists changed, staged and untracked files.' },
    { id: 'l0-q-multi', type: 'multi', prompt: 'Which of these belong in a repository?', options: ['source code', 'your password', 'the README', 'build output'], answer: [0, 2] },
    { id: 'l0-q-fill', type: 'fill', prompt: 'Complete the command.', text: 'Stage every change: [[a]]', answer: { a: ['git add .', 'git add -A', 'git add --all'] } },
    { id: 'l0-q-order', type: 'order', prompt: 'Put the steps in order.', items: ['Edit a file', 'git add', 'git commit', 'git push'] },
    { id: 'l0-q-match', type: 'match', prompt: 'Match the command to what it does.', pairs: [['git init', 'start a repository'], ['git clone', 'copy a repository from GitHub'], ['git push', 'send commits to GitHub']] }
  ]
});
