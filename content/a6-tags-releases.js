/* a6 = 3.6 Tags, releases and stash. Simulator notes: git tag -a/-m is accepted but the simulator stores every tag
 * the same way (no separate tag object, no git tag -n, git show v1.0 shows the commit). The release form is simplified. */
TDC.registerTopic({
  id: 'a6',
  title: 'Tags, releases and stash',
  subtitle: 'Put a name on the version you hand in, publish it on GitHub, and park unfinished work.',
  audience: 'students and staff who deliver work to others · after Signing in securely',
  objectives: [
    'create a lightweight and an annotated tag and say how they differ',
    'push tags to GitHub and list them',
    'choose a sensible version name (v1.0, v1.1, v2.0)',
    'publish a GitHub release with notes and an attached PDF',
    'park work with git stash, switch branch, and bring the work back'
  ],
  glossary: {
    tag: { term: 'tag', def: 'A fixed name for one commit, such as <code>v1.0</code>. Unlike a branch, a tag never moves. Use it to mark the version you handed in or published.' },
    release: { term: 'release', def: 'A page on GitHub built around a tag: a title, notes, and files you attach (for example the final PDF). The newest one is marked <b>Latest</b>.' },
    semver: { term: 'semantic version', def: 'A version number in three parts, <code>MAJOR.MINOR.PATCH</code>, for example <code>1.2.0</code>. Bump MAJOR for big changes, MINOR for added content, PATCH for small fixes.' }
  },
  commands: [
    { cmd: 'git tag', does: 'List all tags' },
    { cmd: 'git tag <name>', does: 'Put a lightweight tag on the current commit' },
    { cmd: 'git tag -a <name> -m "msg"', does: 'Create an annotated tag (author, date and message stored)' },
    { cmd: 'git push origin <name>', does: 'Send one tag to GitHub' },
    { cmd: 'git push --tags', does: 'Send all your tags to GitHub' },
    { cmd: 'git tag -d <name>', does: 'Delete a tag on your computer' },
    { cmd: 'git stash list', does: 'Show the parked changes' }
  ],
  sections: [
    { id: 'a6-why', title: 'Why tag a version?', blocks: [
      { id: 'a6-t1', type: 'text', html: '<p>Your thesis has hundreds of commits. Your supervisor asks: "Which one did you submit?" A <dfn data-term="tag">tag</dfn> answers that. It is a name stuck on one commit, like a bookmark that never moves. A branch moves forward with every commit; a tag stays where you put it.</p><p>Typical uses at school: <code>v1.0</code> for the draft you submitted, <code>final</code> for the graded version of a course project, <code>v2.1</code> for the release of a summer project.</p>' },
      { id: 'a6-tbl', type: 'table', head: ['', 'Lightweight tag', 'Annotated tag'], compact: true, caption: 'Both point at a commit. The annotated one remembers more.', rows: [
        ['Command', '<code>git tag v1.0</code>', '<code>git tag -a v1.0 -m "Submitted draft"</code>'],
        ['Stores', 'only the name', 'name, author, date and a message'],
        ['Use for', 'a private bookmark', 'versions you share (the usual choice)']
      ] },
      { id: 'a6-c1', type: 'callout', kind: 'tip', title: 'In this course simulator', html: 'The simulator accepts <code>-a</code> and <code>-m</code> but stores both kinds of tag the same way. In real Git the annotated tag also keeps its message, which <code>git show v1.0</code> displays; the simulator shows only the commit.' },
      { id: 'a6-q1b', type: 'question', q: 'a6-q-moves' }
    ] },
    { id: 'a6-create', title: 'Create and push a tag', blocks: [
      { id: 'a6-t2', type: 'text', html: '<p>A tag goes on the commit you are on (<code>HEAD</code>). Create it, then list the tags. <b>Tags are not sent by a normal <code>git push</code></b>. You must push them on purpose, either one tag or all of them.</p>' },
      { id: 'a6-code1', type: 'code', lang: 'bash', code: '$ git tag -a v1.0 -m "Draft submitted to supervisor"\n$ git tag\nv1.0\n$ git push origin v1.0      # one tag\n$ git push --tags             # all tags' },
      { id: 'a6-term1', type: 'interactive', widget: 'terminal', title: 'Tag the submitted version and push it',
        caption: 'You cloned <code>thesis-aino</code> and the latest commit is your draft. Tag it <code>v1.0</code>, then send the tag to GitHub.',
        config: {
          world: { me: 'aino', myName: 'Aino Student', config: { 'user.name': 'Aino Student', 'user.email': 'aino@example.com', 'init.defaultBranch': 'main' },
            users: { teacher: { name: 'Tiina Teacher' } },
            orgs: { 'hamk-projects': { displayName: 'HAMK Projects', owners: ['teacher'], members: ['aino'] } },
            remotes: { 'hamk-projects/thesis-aino': { collaborators: { aino: 'write' }, commits: [
              { msg: 'Initial commit', author: 'teacher', files: { 'README.md': '# Thesis: Aino Student\n' } },
              { msg: 'Add chapter 1 draft', author: 'aino', files: { 'chapter1.md': '# Introduction\n' } }] } },
            run: ['git clone https://github.com/hamk-projects/thesis-aino.git', 'cd thesis-aino'], cwd: '~' },
          panels: ['graph', 'remote'],
          tasks: [
            { id: 'tag', text: 'Create the tag <code>v1.0</code> on the latest commit', hint: 'git tag -a v1.0 -m "..." (or just git tag v1.0)',
              check: function (w) { var r = w.repo('~/thesis-aino'); return !!r && !!r.tags['v1.0'] && r.tags['v1.0'] === r.heads.main; }, solution: 'git tag -a v1.0 -m "Draft submitted"' },
            { id: 'push', text: 'Send the tag to GitHub', hint: 'A normal git push does not send tags.',
              check: function (w) { var s = w.server.repos['hamk-projects/thesis-aino']; return !!s.tags['v1.0']; }, solution: 'git push origin v1.0' }
          ] } },
      { id: 'a6-c2', type: 'callout', kind: 'warn', title: 'Common mistake', html: 'You ran <code>git push</code>, the tag is not on GitHub. Tags travel only with <code>git push origin &lt;tag&gt;</code> or <code>git push --tags</code>. Check on the repository page: tags show on the <b>Releases</b> page.' },
      { id: 'a6-q2b', type: 'question', q: 'a6-q-push' }
    ] },
    { id: 'a6-names', title: 'Choosing version names', blocks: [
      { id: 'a6-t3', type: 'text', html: '<p>Pick names people can sort and understand. The common pattern is <dfn data-term="semver">semantic versioning</dfn>: <code>MAJOR.MINOR.PATCH</code>, with a <code>v</code> in front.</p>' },
      { id: 'a6-tbl2', type: 'table', head: ['Change', 'Bump', 'Example'], rows: [
        ['Typo or small fix after submitting', 'PATCH', '<code>v1.0.0</code> → <code>v1.0.1</code>'],
        ['New chapter or material added, old parts still valid', 'MINOR', '<code>v1.0.1</code> → <code>v1.1.0</code>'],
        ['Rewritten structure or new course edition', 'MAJOR', '<code>v1.1.0</code> → <code>v2.0.0</code>']
      ] },
      { id: 'a6-c3', type: 'callout', kind: 'school', title: 'School tip', html: 'For a thesis a plain name is fine: <code>draft-1</code>, <code>submitted</code>, <code>final</code>. Agree the pattern with your supervisor, and never reuse a name for a different commit.' },
      { id: 'a6-q3b', type: 'question', q: 'a6-q-semver' }
    ] },
    { id: 'a6-release', title: 'Publish a GitHub release', blocks: [
      { id: 'a6-t4', type: 'text', html: '<p>A tag is only a name. A <dfn data-term="release">release</dfn> turns it into a page people can find: a title, notes about what changed, and files to download, such as the final PDF. This is how a thesis or summer project is handed over: whoever takes over opens <b>Releases</b> and gets the finished version.</p>' },
      { id: 'a6-list1', type: 'list', steps: true, items: [
        'Open the repository, then <b>Releases</b> (right-hand side of the <b>Code</b> tab).',
        'Click <b>Draft a new release</b>.',
        'Choose a tag. Type a new name to create the tag together with the release.',
        'Write a title and describe the release.',
        'Attach the PDF, then click <b>Publish release</b>.'
      ] },
      { id: 'a6-gh1', type: 'interactive', widget: 'github', title: 'Publish release v1.0 with the thesis PDF',
        caption: 'You are Aino, with Write access. Releases need Write access or higher.',
        config: {
          start: '/hamk-projects/thesis-aino/releases', personas: ['aino', 'ben'], uploads: { 'thesis.pdf': 'PDF' },
          world: { me: 'aino', myName: 'Aino Student', config: { 'user.name': 'Aino Student', 'user.email': 'aino@example.com' },
            users: { teacher: { name: 'Tiina Teacher' }, ben: { name: 'Ben Opiskelija' } },
            orgs: { 'hamk-projects': { displayName: 'HAMK Projects', owners: ['teacher'], members: ['aino', 'ben'], settings: { basePermission: 'read' } } },
            remotes: { 'hamk-projects/thesis-aino': { description: 'Bachelor thesis: version control at HAMK', collaborators: { aino: 'write' }, commits: [
              { msg: 'Initial commit', author: 'teacher', files: { 'README.md': '# Thesis: Aino Student\n' } },
              { msg: 'Final version', author: 'aino', files: { 'chapter1.md': '# Introduction\n' } }] } },
            run: [] },
          tasks: [
            { id: 'draft', text: 'Click <b>Draft a new release</b>', check: function (w) { return w.did('click', function (e) { return e.id === 'draft-release'; }); } },
            { id: 'publish', text: 'Publish a release for the tag <code>v1.0</code> with the notes filled in and <code>thesis.pdf</code> attached', hint: 'Tick the paperclip box before you publish.',
              check: function (w) { var s = w.server.repos['hamk-projects/thesis-aino']; return s.releases.some(function (x) { return x.tag === 'v1.0' && x.notes.trim() && x.files.indexOf('thesis.pdf') >= 0; }); },
              solution: 'Releases → Draft a new release → tag v1.0, add notes, tick thesis.pdf → Publish release' },
            { id: 'tagmade', text: 'Check that the tag <code>v1.0</code> now exists in the repository', check: function (w) { return !!w.server.repos['hamk-projects/thesis-aino'].tags['v1.0']; } }
          ] } },
      { id: 'a6-c4', type: 'callout', kind: 'info', title: 'The Latest label', html: 'GitHub marks the newest release as <b>Latest</b> automatically; older releases stay available. <b>Pre-release</b> and <b>draft</b> releases exist too, for work that is not final. The simulator keeps the form simple and has no pre-release box.' },      { id: 'a6-q4b', type: 'question', q: 'a6-q-release' }
    ] },
    { id: 'a6-stash', title: 'Stash: park work in progress', blocks: [
      { id: 'a6-t5', type: 'text', html: '<p>You are halfway through an edit when the supervisor asks you to fix something on another branch. Git will not switch branches if the switch would overwrite your edit. You do not want to commit half-finished work either. <dfn data-term="stash">Stash</dfn> takes the edit off your desk and puts it on a shelf.</p>' },
      { id: 'a6-code2', type: 'code', lang: 'bash', code: '$ git stash\nSaved working directory and index state WIP on main: 3f2a1b9 Start notes\n$ git switch draft\n$ git switch main\n$ git stash list\nstash@{0}: WIP on main: 3f2a1b9 Start notes\n$ git stash pop' },
      { id: 'a6-term2', type: 'interactive', widget: 'terminal', title: 'Park an edit, switch branch and come back',
        caption: 'You edited <code>notes.md</code> on <code>main</code>. The <code>draft</code> branch changed the same file. Try <code>git switch draft</code> first and read the error.',
        config: {
          world: { config: { 'user.name': 'Aino Student', 'user.email': 'aino@example.com', 'init.defaultBranch': 'main' }, cwd: '~/thesis',
            files: { '~/thesis/notes.md': '# Notes\n' },
            run: ['git init', 'git add .', 'git commit -m "Start notes"', 'git switch -c draft', 'echo "draft text" >> notes.md', 'git commit -am "Draft change"', 'git switch main', 'echo "half-written idea" >> notes.md'] },
          panels: ['areas', 'graph'],
          tasks: [
            { id: 'stash', text: 'Stash the edit so the folder is clean', hint: 'git stash',
              check: function (w) { var r = w.repo(); return !!r && r.stash.length > 0 && w.status(r).clean; }, solution: 'git stash' },
            { id: 'switch', text: 'Switch to <code>draft</code> while the edit is parked', hint: 'git switch draft',
              check: function (w) { var r = w.repo(); return !!r && r.HEAD.branch === 'draft' && w.ran(/^git (switch|checkout) draft/); }, solution: 'git switch draft' },
            { id: 'back', text: 'Go back to <code>main</code> and bring the edit back', hint: 'git switch main, then git stash pop',
              check: function (w) { var r = w.repo(); return !!r && r.HEAD.branch === 'main' && w.ran(/^git stash (pop|apply)/) && (w.workTree(r)['notes.md'] || '').indexOf('half-written idea') >= 0; }, solution: 'git switch main\ngit stash pop' }
          ] } },
      { id: 'a6-c5', type: 'callout', kind: 'warn', title: 'Common mistake', html: 'Popping on the wrong branch. The stash is not tied to a branch: <code>git stash pop</code> applies the edit wherever you are. Switch back first, then pop. Stashes live only on your computer, so they are not backed up and not pushed.' },
      { id: 'a6-q5b', type: 'question', q: 'a6-q-order' },
      { id: 'a6-q6b', type: 'question', q: 'a6-q-fill' }
    ] },
    { id: 'a6-summary', title: 'Summary', blocks: [
      { id: 'a6-sum', type: 'list', items: [
        'A tag is a fixed name for one commit. A branch moves; a tag does not.',
        'Annotated tags (<code>-a -m</code>) store who, when and why; use them for shared versions.',
        'Tags need their own push: <code>git push origin v1.0</code> or <code>git push --tags</code>.',
        'Use <code>MAJOR.MINOR.PATCH</code> names, and never reuse a name for another commit.',
        'A GitHub release adds notes and downloadable files to a tag; the newest is marked Latest.',
        '<code>git stash</code> parks uncommitted work, <code>git stash list</code> shows it, <code>git stash pop</code> brings it back.'
      ] }
    ] }
  ],
  questions: [
    { id: 'a6-q-moves', type: 'mc', prompt: 'Aino tagged her submitted thesis <code>v1.0</code>, then made five more commits on <code>main</code>. Where does <code>v1.0</code> point now?',
      options: ['To the newest commit, like a branch', 'To the commit she tagged', 'To the first commit of the project', 'It disappears after the next commit'],
      answer: 1, hints: ['What is the difference between a tag and a branch?'], explain: 'A tag never moves. That is why it is good for "the version I handed in". A branch would follow the newest commit.' },
    { id: 'a6-q-push', type: 'mc', prompt: 'You created tag <code>v1.0</code> and ran <code>git push</code>. The tag is missing on GitHub. Why?',
      options: ['Tags can only be created on GitHub', 'A normal push does not send tags', 'You need Admin permission to push tags', 'Tags are sent only after a merge'],
      answer: 1, hints: ['Two commands send tags.'], explain: 'Push tags yourself with <code>git push origin v1.0</code> or <code>git push --tags</code>.' },
    { id: 'a6-q-semver', type: 'mc', prompt: 'The thesis is published as <code>v1.1.0</code>. You fix a typo in chapter 2 and publish again. Which name fits best?',
      options: ['<code>v2.0.0</code>', '<code>v1.2.0</code>', '<code>v1.1.1</code>', '<code>v1.1.0</code> again'],
      answer: 2, hints: ['Small fix: which of the three numbers?'], explain: 'A small fix raises the PATCH number. Reusing <code>v1.1.0</code> would put one name on two different versions.' },
    { id: 'a6-q-release', type: 'multi', prompt: 'Which things does a GitHub release add on top of a plain tag?',
      options: ['A title and release notes', 'Files to download, such as a PDF', 'A copy of the repository in another organization', 'A Latest label for the newest one'],
      answer: [0, 1, 3], explain: 'A release is a page built around a tag. It does not copy the repository anywhere.' },
    { id: 'a6-q-order', type: 'order', prompt: 'Put these steps in order: you have an unfinished edit and must fix something on branch <code>draft</code>.',
      items: ['<code>git stash</code>', '<code>git switch draft</code>', 'fix and commit on <code>draft</code>', '<code>git switch main</code>', '<code>git stash pop</code>'],
      explain: 'Park, switch, work, switch back, then pop. Popping on <code>draft</code> would put the half-finished edit on the wrong branch.' },
    { id: 'a6-q-fill', type: 'fill', prompt: 'Complete the command that shows your parked changes.', text: 'git stash [[a]]',
      answer: { a: ['list'] }, hints: ['It is also the word for a series of items.'], explain: '<code>git stash list</code> prints one line per stash, newest first, as <code>stash@{0}</code>.' }
  ]
});
