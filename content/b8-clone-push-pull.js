/* b8 = Clone, push and pull (terminal with remote panel + GitHub Desktop). */
(function () {
  var URL = 'https://github.com/hamk-projects/course-notes.git';
  var CFG = { 'user.name': 'Aino Student', 'user.email': 'aino@example.com', 'init.defaultBranch': 'main' };
  var ORGS = { 'hamk-projects': { displayName: 'HAMK Projects', owners: ['teacher'], members: ['aino'] } };
  function remote(withWeek2) {
    var commits = [
      { msg: 'Initial commit', author: 'teacher', files: { 'README.md': '# Course notes\nShared notes for the autumn course.\n' } },
      { msg: 'Add week 1 notes', author: 'teacher', files: { 'week1.md': '# Week 1\nIntroduction.\n' } }
    ];
    if (withWeek2) commits.push({ msg: 'Add week 2 plan', author: 'teacher', files: { 'week2.md': '# Week 2\nPlan for the week.\n' } });
    var o = {}; o['hamk-projects/course-notes'] = { description: 'Shared course notes', collaborators: { aino: 'write' }, commits: commits };
    return o;
  }
  // Already cloned, but the teacher has pushed one more commit since. keepRef: the app already knows about it.
  // (A clone always gets every commit, so we step the local copy back one commit.)
  function behind(extra, keepRef, signedIn) {
    var run = ['git clone ' + URL, 'cd course-notes', 'git reset --hard HEAD~1'];
    if (!keepRef) run.push('git remote remove origin', 'git remote add origin ' + URL);
    return { me: 'aino', myName: 'Aino Student', signedIn: signedIn !== false, config: CFG, orgs: ORGS, remotes: remote(true), cwd: '~', run: run.concat(extra || []) };
  }
  function ranRe(w, re) { return w.log.some(function (l) { return !l.code && re.test(l.cmd); }); }
  function rejectedPush(w) { return w.log.some(function (l) { return l.code && /^git push/.test(l.cmd); }); }
  function rem(w) { return w.server.repos['hamk-projects/course-notes']; }
  var LOCAL = ['echo "Questions for the teacher." >> week1.md', 'git commit -am "Add my questions to week 1"'];

  TDC.registerTopic({
    id: 'b8',
    title: 'Clone, push and pull',
    subtitle: 'Connect your computer to a school repository: download it, send your commits, and get other people\'s changes.',
    audience: 'everyone · after your first commits',
    objectives: [
      'explain the local copy, the remote copy and origin',
      'copy a repository from GitHub with git clone and sign in',
      'send your commits with git push and fetch new ones with git pull',
      'read "ahead" and "behind" in git status',
      'fix a rejected push (fetch first) by pulling',
      'do the same with Clone, Push origin and Pull origin in GitHub Desktop'
    ],
    glossary: {
      remote: { term: 'remote', def: 'A copy of the repository that lives on another computer, such as GitHub. Git gives it a short name; the usual one is <code>origin</code>.' },
      origin: { term: 'origin', def: 'The default name of the remote you cloned from.' },
      clone: { term: 'clone', def: 'A full copy of a repository, with its whole history, on your own computer.' },
      push: { term: 'push', def: 'Send your new commits to the remote.' },
      pull: { term: 'pull', def: 'Fetch new commits from the remote and add them to your branch.' },
      gcm: { term: 'Git Credential Manager', def: 'A helper installed with Git for Windows (and available for macOS and Linux). It opens the GitHub sign-in window and remembers you, so you do not type a password for every push.' }
    },
    commands: [
      { cmd: 'git clone <url>', does: 'Download a repository from GitHub into a new folder' },
      { cmd: 'git remote -v', does: 'Show the remotes (normally origin) and their URLs' },
      { cmd: 'git push', does: 'Send your new commits to GitHub' },
      { cmd: 'git fetch', does: 'Look for new commits on GitHub without changing your files' },
      { cmd: 'git pull', does: 'Fetch new commits from GitHub and add them to your branch' },
      { cmd: 'git status', does: 'Also tells you if you are ahead of or behind GitHub' }
    ],
    sections: [
      { id: 'b8-copies', title: 'Local and remote copies', blocks: [
        { id: 'b8-copies-t', type: 'text', html: '<p>Until now your repository lived only on your computer. A school project is shared, so there is a second copy on GitHub: the <dfn data-term="remote">remote</dfn>. Git keeps the two copies in step only when you tell it to. Nothing happens automatically.</p>' },
        { id: 'b8-fig', type: 'figure', alt: 'Your computer and GitHub, with clone, push and pull arrows between them',
          caption: '<b>clone</b> copies GitHub to your computer once. <b>push</b> sends your commits up, <b>pull</b> brings other people\'s commits down.',
          svg: '<svg viewBox="0 0 520 150" width="100%" role="img" fill="none" stroke="currentColor" stroke-width="2" font-family="inherit" font-size="14"><rect x="10" y="30" width="170" height="90" rx="10"/><text x="95" y="68" text-anchor="middle" fill="currentColor" stroke="none" font-weight="700">Your computer</text><text x="95" y="92" text-anchor="middle" fill="currentColor" stroke="none">local repository</text><rect x="340" y="30" width="170" height="90" rx="10"/><text x="425" y="68" text-anchor="middle" fill="currentColor" stroke="none" font-weight="700">GitHub</text><text x="425" y="92" text-anchor="middle" fill="currentColor" stroke="none">remote "origin"</text><path d="M185 55 H335 M327 49 L335 55 L327 61"/><text x="260" y="46" text-anchor="middle" fill="currentColor" stroke="none">push</text><path d="M335 95 H185 M193 89 L185 95 L193 101"/><text x="260" y="116" text-anchor="middle" fill="currentColor" stroke="none">pull / fetch</text><text x="260" y="146" text-anchor="middle" fill="currentColor" stroke="none" font-style="italic">clone = the first copy</text></svg>' },
        { id: 'b8-copies-c', type: 'callout', kind: 'school', title: 'At HAMK', html: 'Course repositories live in the organization <b>HAMK Projects</b> (<code>hamk-projects</code>). In this lesson Aino works in <code>hamk-projects/course-notes</code>, which the teacher also edits.' },
        { id: 'b8-q-remote-blk', type: 'question', q: 'b8-q-remote' }
      ] },
      { id: 'b8-clone', title: 'Clone', blocks: [
        { id: 'b8-clone-t', type: 'text', html: '<p><code>git clone</code> downloads a repository with its whole history into a new folder and remembers where it came from under the name <dfn data-term="origin">origin</dfn>. Use the HTTPS address from the green <b>Code</b> button on the repository page.</p>' },
        { id: 'b8-clone-code', type: 'code', lang: 'bash', code: '$ git clone https://github.com/hamk-projects/course-notes.git\nCloning into \'course-notes\'...\n$ cd course-notes\n$ git remote -v\norigin  https://github.com/hamk-projects/course-notes.git (fetch)\norigin  https://github.com/hamk-projects/course-notes.git (push)' },
        { id: 'b8-clone-c', type: 'callout', kind: 'tip', html: 'You do not run <code>git init</code> after a clone: the cloned folder is already a repository. Clone once per computer, not once per day.' },
        { id: 'b8-q-clone-blk', type: 'question', q: 'b8-q-clone' }
      ] },
      { id: 'b8-push', title: 'Push your commits', blocks: [
        { id: 'b8-push-t', type: 'text', html: '<p>A commit is saved on your computer only. <code>git push</code> sends your new commits to GitHub so others can see them. The first time, GitHub needs to know who you are: the <dfn data-term="gcm">Git Credential Manager</dfn> opens a <b>Connect to GitHub</b> window where you sign in with your browser. It then remembers you.</p>' },
        { id: 'b8-push-c', type: 'callout', kind: 'info', title: 'Passwords', html: 'GitHub no longer accepts your account password for Git commands over HTTPS. The sign-in window (or a personal access token) replaces it.' },
        { id: 'b8-push-sim', type: 'interactive', widget: 'terminal', title: 'Clone, commit and push',
          caption: 'You are not signed in to GitHub yet. Clone, make a change, then push; sign in when the window opens.',
          config: {
            world: { me: 'aino', myName: 'Aino Student', signedIn: false, config: CFG, orgs: ORGS, remotes: remote(false), cwd: '~' },
            panels: ['remote', 'graph'],
            tasks: [
              { id: 'clone', text: 'Clone <code>hamk-projects/course-notes</code>: <code>git clone ' + URL + '</code> (sign in when asked)',
                check: function (w) { var r = w.repo('~/course-notes'); return !!r && w.commitsOn(r).length > 0; },
                hint: 'Copy the address from the code box above.', solution: 'git clone ' + URL },
              { id: 'commit', text: 'Go into the folder (<code>cd course-notes</code>), add a line to <code>week1.md</code> and commit it',
                check: function (w) { var r = w.repo('~/course-notes'); return !!r && w.commitsOn(r).length > 2; },
                hint: 'echo "My note" >> week1.md, then git commit -am "Add my note".', solution: 'cd course-notes, echo "My note" >> week1.md, git commit -am "Add my note"' },
              { id: 'push', text: 'Send your commit to GitHub: <code>git push</code>',
                check: function (w) { var r = w.repo('~/course-notes'); return !!r && w.commitsOn(r).length > 2 && rem(w).refs.main === r.heads.main; },
                solution: 'git push' }
            ]
          } },
        { id: 'b8-q-push-blk', type: 'question', q: 'b8-q-push' }
      ] },
      { id: 'b8-pull', title: 'Pull others\' changes', blocks: [
        { id: 'b8-pull-t', type: 'text', html: '<p>The teacher pushes a new commit to the same repository. Your copy does not change until you ask. Two commands do it:</p><ul><li><code>git fetch</code> only <em>looks</em>: it downloads the news into Git, but your files stay as they are.</li><li><code>git pull</code> does a fetch and then adds the new commits to your branch, so your files change.</li></ul><p><code>git status</code> tells you where you stand: <em>"Your branch is behind \'origin/main\' by 1 commit"</em> means GitHub has a commit you do not have; <em>"ahead"</em> means you have one GitHub does not. After a fetch, status uses the fresh information.</p>' },
        { id: 'b8-pull-sim', type: 'interactive', widget: 'terminal', title: 'Get the teacher\'s new commit',
          caption: 'Aino cloned <code>course-notes</code> yesterday. The teacher has pushed a commit since. (The simulator steps her copy back one commit to set this up.)',
          config: {
            world: behind(),
            panels: ['remote', 'graph'],
            tasks: [
              { id: 'fetch', text: 'Look for news without changing your files: <code>git fetch</code>', check: function (w) { return ranRe(w, /^git fetch/); }, solution: 'git fetch' },
              { id: 'status', text: 'Run <code>git status</code> and read the "behind" line', check: function (w) { var f = false; return w.log.some(function (l) { if (!l.code && /^git fetch/.test(l.cmd)) f = true; return f && !l.code && /^git status/.test(l.cmd); }); },
                hint: 'Do the fetch first; before it, status does not know about the new commit.', solution: 'git status' },
              { id: 'pull', text: 'Bring the new commit into your folder: <code>git pull</code>', check: function (w) { return !!w.readFile('~/course-notes/week2.md'); }, solution: 'git pull' }
            ]
          } },
        { id: 'b8-q-pull-blk', type: 'question', q: 'b8-q-pull' }
      ] },
      { id: 'b8-rejected', title: 'When a push is rejected', blocks: [
        { id: 'b8-rej-t', type: 'text', html: '<p>You commit, the teacher pushes first, and then your <code>git push</code> fails:</p>' },
        { id: 'b8-rej-code', type: 'code', lang: 'text', code: ' ! [rejected]        main -> main (fetch first)\nerror: failed to push some refs to \'https://github.com/hamk-projects/course-notes.git\'\nhint: Updates were rejected because the remote contains work that you do not\nhint: have locally.' },
        { id: 'b8-rej-t2', type: 'text', html: '<p>Nothing is broken and nothing is lost. GitHub refuses to overwrite the teacher\'s commit. The fix has two steps: <code>git pull</code> to bring in their commit (Git joins the two lines of work, possibly with a merge commit), then <code>git push</code> again. On some computers Git first stops with <em>"Need to specify how to reconcile divergent branches"</em>: run <code>git config --global pull.rebase false</code> once, then <code>git pull</code> again.</p>' },
        { id: 'b8-rej-c', type: 'callout', kind: 'warn', title: 'Do not force it', html: '<code>git push --force</code> would overwrite the teacher\'s work on GitHub. It is almost never the answer to this message. If the pull reports a conflict, that is a topic for a later lesson.' },
        { id: 'b8-rej-sim', type: 'interactive', widget: 'terminal', title: 'Recover from a rejected push',
          caption: 'Aino has committed a change to <code>week1.md</code>, but the teacher pushed a commit first.',
          config: {
            world: behind(LOCAL),
            panels: ['remote', 'graph'],
            tasks: [
              { id: 'push', text: 'Try <code>git push</code> and read the rejection', check: rejectedPush, solution: 'git push' },
              { id: 'pull', text: 'Bring in the teacher\'s commit: <code>git pull</code>', check: function (w) { return !!w.readFile('~/course-notes/week2.md') && ranRe(w, /^git pull/); }, solution: 'git pull' },
              { id: 'push2', text: 'Push again', check: function (w) { var r = w.repo('~/course-notes'); return rejectedPush(w) && rem(w).refs.main === r.heads.main && !!r.heads.main && w.commitsOn(r).length >= 4; },
                solution: 'git push' }
            ]
          } },
        { id: 'b8-q-rej-blk', type: 'question', q: 'b8-q-rej' }
      ] },
      { id: 'b8-gui', title: 'In GitHub Desktop', blocks: [
        { id: 'b8-gui-t', type: 'text', html: '<p>GitHub Desktop runs the same commands behind buttons. It signs you in with your GitHub account when you first start it.</p>' },
        { id: 'b8-gui-tabs', type: 'tabs', group: 'tool', tabs: [
          { label: 'Terminal', icon: '⌨️', blocks: [{ id: 'b8-gt-t', type: 'text', html: '<p><code>git clone</code>, <code>git push</code>, <code>git fetch</code>, <code>git pull</code>.</p>' }] },
          { label: 'GitHub Desktop', icon: '🖥️', blocks: [{ id: 'b8-gd-t', type: 'table', head: ['Goal', 'Where'], rows: [            ['Clone', '<b>File → Clone repository…</b> (or <b>Clone a Repository from the Internet…</b> on the start screen), pick the repository, <b>Clone</b>'],
            ['Check for news', 'Top bar, <b>Fetch origin</b>'],
            ['Get new commits', 'The same button turns into <b>Pull origin</b> when GitHub has news'],
            ['Send your commits', 'The same button turns into <b>Push origin</b> after you commit']
          ] }] }
        ] },
        { id: 'b8-gui-sim', type: 'interactive', widget: 'gitgui', title: 'Pull, commit and push in GitHub Desktop',
          caption: 'The teacher has pushed a commit. The top bar shows what to do. Use "your text editor" below the app to edit files.',
          config: { skin: 'desktop', panels: ['graph'], world: behind(null, true),
            tasks: [
              { id: 'pull', text: 'Click <b>Pull origin</b> to get the teacher\'s commit', check: function (w) { return !!w.readFile('~/course-notes/week2.md'); }, solution: 'Click Pull origin in the top bar' },
              { id: 'edit', text: 'Edit <code>week1.md</code> in your text editor, save, and commit it with a summary', check: function (w) { var r = w.repo('~/course-notes'); return !!r && w.commitsOn(r).length > 3; }, solution: 'Edit week1.md, write a summary, click Commit to main' },
              { id: 'push', text: 'Click <b>Push origin</b>', check: function (w) { var r = w.repo('~/course-notes'); return !!r && w.commitsOn(r).length > 3 && rem(w).refs.main === r.heads.main; }, solution: 'Click Push origin' }
            ] } },
        { id: 'b8-q-gui-blk', type: 'question', q: 'b8-q-gui' }
      ] },
      { id: 'b8-summary', title: 'Summary', blocks: [
        { id: 'b8-sum', type: 'list', items: [
          '<code>git clone &lt;url&gt;</code> copies a repository from GitHub once; the source is called <code>origin</code>.',
          '<code>git push</code> sends your commits to GitHub; the first time you sign in through the Git Credential Manager.',
          '<code>git fetch</code> looks for news; <code>git pull</code> fetches and adds the new commits to your branch.',
          '<code>git status</code> shows if you are ahead of or behind <code>origin</code>.',
          'A rejected push ("fetch first") means GitHub has commits you lack: <code>git pull</code>, then <code>git push</code>. Do not force.'
        ] }
      ] }
    ],
    questions: [
      { id: 'b8-q-remote', type: 'mc', prompt: 'You commit three times on your computer. What does your teacher see on GitHub?',
        options: ['The three commits, right away', 'Nothing new until you push', 'Nothing new until the teacher pulls', 'Only the last commit'], answer: 1, shuffle: false,
        hints: ['Which command sends commits to GitHub?'], explain: 'Commits stay on your computer until you run <code>git push</code>. The teacher also does not need to pull to see them on GitHub; pulling is for getting changes <em>to</em> a computer.' },
      { id: 'b8-q-clone', type: 'fill', prompt: 'Complete the command to copy a repository from GitHub.', text: '[[a]] https://github.com/hamk-projects/course-notes.git',
        answer: { a: ['git clone'] }, explain: '<code>git clone</code> creates the folder, copies the history and sets up <code>origin</code>.' },
      { id: 'b8-q-push', type: 'mc', prompt: 'A window titled "Connect to GitHub" opens during your first push. What should you do?',
        options: ['Close it and push again', 'Sign in to GitHub in the browser; Git remembers you', 'Type your email password', 'Run git init'], answer: 1, shuffle: false,
        explain: 'It is the Git Credential Manager. Signing in once lets later pushes work without asking again.' },
      { id: 'b8-q-pull', type: 'match', prompt: 'Match the command to what it does.',
        pairs: [['git fetch', 'looks for new commits, your files stay the same'], ['git pull', 'fetches and adds new commits to your branch'], ['git push', 'sends your commits to GitHub']], explain: 'Fetch is safe to run any time; pull changes your files; push changes GitHub.' },
      { id: 'b8-q-rej', type: 'order', prompt: 'Your push was rejected with "fetch first". Put the steps in order.',
        items: ['Read the error: GitHub has a commit you do not have', '<code>git pull</code>', '<code>git push</code>'], explain: 'Bring in their commit first; then your push can build on top of it.' },
      { id: 'b8-q-gui', type: 'multi', prompt: 'Which statements about GitHub Desktop\'s top button are true?',
        options: ['It reads <b>Fetch origin</b> when there is nothing to do', 'It reads <b>Pull origin</b> when GitHub has new commits', 'It reads <b>Push origin</b> when you have commits GitHub lacks', 'It deletes your local commits'], answer: [0, 1, 2], explain: 'One button, three jobs: fetch, pull or push, depending on the situation. It never deletes your commits.' }
    ]
  });
})();
