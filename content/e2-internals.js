/* e2 = Inside Git: objects, refs and recovery. Terminal simulators only (graph panel). */
TDC.registerTopic({
  id: 'e2',
  title: 'Inside Git: objects, refs and recovery',
  subtitle: 'Look inside the .git folder, understand HEAD, and bring back work you thought was lost.',
  audience: 'experienced users · after branching and merging',
  objectives: [
    'name the three kinds of Git objects: blob, tree and commit',
    'inspect a commit, its tree and a file with git cat-file',
    'explain what a branch, a tag and HEAD really are',
    'explain detached HEAD and get back to a branch safely',
    'recover a deleted branch or a bad reset with git reflog'
  ],
  glossary: {
    sha: { term: 'SHA (object id)', def: 'The long code of letters and digits that names a Git object. It is calculated from the content, so the same content always gets the same id. Usually shown shortened to 7 characters.' },
    head: { term: 'HEAD', def: 'Git’s “you are here” marker. Normally it points to a branch, and that branch points to a commit.' },
    reflog: { term: 'reflog', def: 'A private diary of where HEAD has been on your computer. It lets you find commits that no branch points to any more. It is not shared on push, and old entries expire after a few weeks.' },
    detachedhead: { term: 'detached HEAD', def: 'A state where HEAD points straight to a commit instead of to a branch. Fine for looking around, but new commits belong to no branch.' }
  },
  commands: [
    { cmd: 'git cat-file -t <id>', does: 'Show the type of an object: blob, tree or commit' },
    { cmd: 'git cat-file -p <id>', does: 'Print the content of an object in readable form' },
    { cmd: 'git checkout <commit-id>', does: 'Look at an old commit (detached HEAD); return with git switch main' },
    { cmd: 'git reflog', does: 'List where HEAD has been, newest first (HEAD@{0}, HEAD@{1}, …)' },
    { cmd: 'git branch <name> <id>', does: 'Create a branch that points to a given commit (recovery)' },
    { cmd: 'git reset --hard HEAD@{1}', does: 'Move the current branch back to where HEAD was one step ago' }
  ],
  sections: [
    { id: 'e2-objects', title: 'Three kinds of objects', blocks: [
      { id: 'e2-t1', type: 'text', html: '<p>Inside every repository is a hidden <code>.git</code> folder. It is a small database. Everything Git stores there is an <b>object</b>, and every object has a name: a <dfn data-term="sha">SHA</dfn> calculated from its content. There are only three kinds of object you need to know.</p>' },
      { id: 'e2-tbl', type: 'table', head: ['Object', 'What it holds', 'Think of it as'],
        rows: [['<b>blob</b>', 'The content of one file (not its name)', 'a page'],
               ['<b>tree</b>', 'A list of file names and folders, each pointing to a blob or another tree', 'a folder listing'],
               ['<b>commit</b>', 'A pointer to one tree, the parent commit(s), the author, the date and the message', 'a labelled snapshot']] },
      { id: 'e2-c1', type: 'callout', kind: 'key', title: 'Key idea', html: 'A commit does not store “changes”. It points to a complete snapshot (a tree). Git saves space because unchanged files share the same blob.' },
      { id: 'e2-q1', type: 'question', q: 'e2-q-objects' },
      { id: 'e2-t2', type: 'text', html: '<p>Because the id comes from the content, two identical files are stored once, and any change to a file, even one letter, creates a new blob with a new id. That is also how Git notices damage: the content no longer matches its name.</p>' }
    ] },
    { id: 'e2-inspect', title: 'Look inside with cat-file', blocks: [
      { id: 'e2-t3', type: 'text', html: '<p><code>git cat-file</code> shows an object. <code>-t</code> prints its type, <code>-p</code> prints its content. Start with the commit HEAD points to, then follow the <code>tree</code> id it shows, then a <code>blob</code> id from that tree.</p>' },
      { id: 'e2-code1', type: 'code', lang: 'bash', code: '$ git cat-file -p HEAD\ntree 9f2c…\nparent 41ab…\nauthor Aino Student <aino@example.com> 1767225600 +0200\ncommitter Aino Student <aino@example.com> 1767225600 +0200\n\nAdd conclusion\n$ git cat-file -p 9f2c\n100644 blob 7d1e…\tintro.md\n100644 blob c03a…\tnotes.md\n$ git cat-file -p 7d1e\n# Introduction' },
      { id: 'e2-c2', type: 'callout', kind: 'info', title: 'In the simulator', html: 'Your ids will differ from the example, which is normal. You only need the first 4 to 7 characters of an id. In this simulator, <code>cat-file</code> works on commits first, and then on the tree and blob ids it has printed.' },
      { id: 'e2-term1', type: 'interactive', widget: 'terminal', title: 'Follow a commit down to a file',
        caption: 'Run each command, then copy the id from the output into the next one.',
        config: {
          world: { config: { 'user.name': 'Aino Student', 'user.email': 'aino@example.com', 'init.defaultBranch': 'main' }, cwd: '~/thesis',
            files: { '~/thesis/intro.md': '# Introduction\n', '~/thesis/notes.md': 'Read three papers.\n' },
            run: ['git init', 'git add .', 'git commit -m "Start thesis"', 'echo "Findings go here." > results.md', 'git add .', 'git commit -m "Add results"'] },
          panels: ['graph'],
          tasks: [
            { id: 'commit', text: 'Print the commit HEAD points to: <code>git cat-file -p HEAD</code>', check: function (w) { return w.ran(/^git cat-file -p HEAD\s*$/); }, solution: 'git cat-file -p HEAD' },
            { id: 'tree', text: 'Copy the <code>tree</code> id and print the tree with <code>git cat-file -p &lt;tree-id&gt;</code>', check: function (w) { return w.ran(/^git cat-file -p [0-9a-f]{4,40}\s*$/); }, hint: 'Type the first 7 characters of the id after <code>tree</code>.' },
            { id: 'blob', text: 'Copy a blob id from the tree and print the file’s content with <code>git cat-file -p &lt;blob-id&gt;</code>', check: function (w) { return w.log.filter(function (l) { return !l.code && /^git cat-file -p [0-9a-f]{4,40}\s*$/.test(l.cmd); }).length >= 2; }, hint: 'Run <code>git cat-file -p &lt;tree-id&gt;</code> again if you lost the ids.' }
          ]
        } },
      { id: 'e2-q2', type: 'question', q: 'e2-q-fill-type' }
    ] },
    { id: 'e2-refs', title: 'Refs and HEAD', blocks: [
      { id: 'e2-t4', type: 'text', html: '<p>Ids are hard to remember, so Git keeps <b>refs</b>: names that point to a commit. A branch is a ref, and so is a tag. A branch ref moves forward automatically when you commit; a tag stays where you put it. Behind the scenes a branch is just a tiny file holding one commit id.</p>' },
      { id: 'e2-t5', type: 'text', html: '<p><dfn data-term="head">HEAD</dfn> says where you are now. Normally HEAD points to a <em>branch</em> and the branch points to a commit, so when you commit the branch moves and HEAD follows.</p>' },
      { id: 'e2-fig1', type: 'figure', alt: 'HEAD points to main, main points to the latest commit',
        caption: 'Normal state: HEAD → main → latest commit.',
        svg: '<svg viewBox="0 0 420 90" role="img" xmlns="http://www.w3.org/2000/svg" font-family="inherit" font-size="13"><g fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="40" cy="60" r="12"/><circle cx="120" cy="60" r="12"/><circle cx="200" cy="60" r="12"/><line x1="52" y1="60" x2="108" y2="60"/><line x1="132" y1="60" x2="188" y2="60"/><rect x="170" y="8" width="60" height="22" rx="4"/><line x1="200" y1="30" x2="200" y2="47"/><rect x="290" y="8" width="60" height="22" rx="4" stroke-dasharray="4 3"/><path d="M290 19 H232"/></g><g fill="currentColor" text-anchor="middle"><text x="200" y="24">main</text><text x="320" y="24">HEAD</text></g></svg>' },
      { id: 'e2-c3', type: 'callout', kind: 'tip', title: 'Relative names', html: '<code>HEAD~1</code> is the parent of HEAD, <code>HEAD~2</code> the grandparent, and <code>HEAD@{1}</code> is “where HEAD was one move ago” (see the reflog below).' },
      { id: 'e2-q3', type: 'question', q: 'e2-q-head' }
    ] },
    { id: 'e2-detached', title: 'Detached HEAD', blocks: [
      { id: 'e2-t6', type: 'text', html: '<p>If you check out a commit id (or a tag) instead of a branch, HEAD points straight to that commit. This is a <dfn data-term="detachedhead">detached HEAD</dfn>. It is perfect for looking at an old version: your files change to match that commit, and nothing is lost.</p>' },
      { id: 'e2-w1', type: 'callout', kind: 'warn', title: 'Common mistake', html: 'If you commit while detached, the new commit has no branch. When you switch away, it is not on any branch any more, so it looks lost. Before switching away, give it a name with <code>git switch -c rescue</code>. (The reflog can still find it, see the next section.)' },
      { id: 'e2-term2', type: 'interactive', widget: 'terminal', title: 'Visit an old commit and come back',
        caption: 'Look at the graph panel: watch HEAD leave the branch name and return.',
        config: {
          world: { config: { 'user.name': 'Aino Student', 'user.email': 'aino@example.com', 'init.defaultBranch': 'main' }, cwd: '~/thesis',
            files: { '~/thesis/intro.md': '# Introduction\n' },
            run: ['git init', 'git add .', 'git commit -m "Start thesis"', 'echo "Method." > method.md', 'git add .', 'git commit -m "Add method"', 'echo "Results." > results.md', 'git add .', 'git commit -m "Add results"'] },
          panels: ['graph'],
          tasks: [
            { id: 'detach', text: 'Check out the first commit: <code>git checkout HEAD~2</code>. Git warns that you are in “detached HEAD” state.', check: function (w) { var r = w.repo(); return !!r && !r.HEAD.branch; }, solution: 'git checkout HEAD~2' },
            { id: 'back', text: 'Go back to the branch with <code>git switch main</code>', check: function (w) { var r = w.repo(); return !!r && r.HEAD.branch === 'main' && w.ran(/^git (checkout|switch)\s+(--detach\s+)?(HEAD[~^@]|[0-9a-f]{4,40})/); }, hint: 'Run git checkout HEAD~2 first.', solution: 'git switch main' }
          ]
        } },
      { id: 'e2-q4', type: 'question', q: 'e2-q-detached' }
    ] },
    { id: 'e2-recover', title: 'Recover lost work with the reflog', blocks: [
      { id: 'e2-t7', type: 'text', html: '<p>Deleting a branch or running <code>git reset --hard</code> only moves or removes a <em>ref</em>. The commits stay in the database for weeks. The <dfn data-term="reflog">reflog</dfn> records every place HEAD has been, so you can find the commit id and point a new branch at it.</p>' },
      { id: 'e2-code2', type: 'code', lang: 'bash', code: '$ git reflog\n3b9c1d2 HEAD@{0}: checkout: moving from draft-intro to main\n8e41f07 HEAD@{1}: commit: Write introduction\n5a20c9e HEAD@{2}: commit: Outline introduction\n$ git branch draft-intro 8e41f07' },
      { id: 'e2-tabs1', type: 'tabs', group: 'tool', tabs: [
        { label: 'Terminal', icon: '⌨️', blocks: [{ id: 'e2-tt', type: 'list', steps: true, items: ['Run <code>git reflog</code> and find the line that shows the last good commit.', 'Copy its short id.', 'Run <code>git branch &lt;name&gt; &lt;id&gt;</code> to bring the work back as a branch.'] }] },
        { label: 'GitHub Desktop', icon: '🖥️', blocks: [{ id: 'e2-tg', type: 'text', html: '<p>GitHub Desktop has no reflog view. GitHub Desktop cannot undo <b>Branch → Delete</b>; use the terminal steps to bring a deleted branch back.</p>' }] }
      ] },
      { id: 'e2-c4', type: 'callout', kind: 'info', title: 'Undoing a reset --hard', html: 'A mistaken <code>git reset --hard HEAD~3</code> is undone the same way: <code>git reflog</code> shows the commit before the reset (for example <code>HEAD@{1}</code>), and <code>git reset --hard HEAD@{1}</code> moves the branch back. Uncommitted edits wiped by <code>--hard</code> are the one thing the reflog cannot bring back.' },
      { id: 'e2-c5', type: 'callout', kind: 'school', title: 'Limits', html: 'The reflog is local to your computer: a teacher or teammate cannot see yours, and a fresh clone has no history of it. Unreferenced commits are eventually cleaned up, so recover soon rather than months later.' },
      { id: 'e2-term3', type: 'interactive', widget: 'terminal', title: 'Delete a branch, then get it back',
        caption: 'The branch draft-intro has two commits that are not on main. Delete it with -D, then recover it.',
        config: {
          world: { config: { 'user.name': 'Aino Student', 'user.email': 'aino@example.com', 'init.defaultBranch': 'main' }, cwd: '~/thesis',
            files: { '~/thesis/README.md': '# Thesis\n' },
            run: ['git init', 'git add .', 'git commit -m "Start thesis"', 'git switch -c draft-intro', 'echo "Outline." > intro.md', 'git add .', 'git commit -m "Outline introduction"', 'echo "Full text." > intro.md', 'git commit -am "Write introduction"', 'git switch main'] },
          panels: ['graph'],
          tasks: [
            { id: 'delete', text: 'Delete the branch: <code>git branch -D draft-intro</code>', check: function (w) { var r = w.repo(); return !!r && !r.heads['draft-intro'] && w.ran(/^git branch -D draft-intro/); }, solution: 'git branch -D draft-intro' },
            { id: 'reflog', text: 'Find the lost commit: <code>git reflog</code>', check: function (w) { return w.ran(/^git reflog/); }, solution: 'git reflog' },
            { id: 'recover', text: 'Make a branch that points to the commit “Write introduction”: <code>git branch &lt;name&gt; &lt;id&gt;</code> (or use <code>HEAD@{n}</code>)', check: function (w) {
                var r = w.repo(); if (!r || !w.ran(/^git branch -D/)) return false;
                return Object.keys(r.heads).some(function (b) { var c = w.commitsOn(r, b); return b !== 'main' && c.length && c[0].msg === 'Write introduction'; });
              }, hint: 'The reflog line “commit: Write introduction” has the id you need.', solution: 'git branch draft-intro HEAD@{1}' }
          ]
        } },
      { id: 'e2-q5', type: 'question', q: 'e2-q-recover' }
    ] },
    { id: 'e2-summary', title: 'Summary', blocks: [
      { id: 'e2-sum', type: 'list', items: [
        'Git stores three kinds of object: <b>blob</b> (file content), <b>tree</b> (folder listing) and <b>commit</b> (snapshot + message + parents).',
        'Object ids are calculated from content; <code>git cat-file -t/-p</code> shows type and content.',
        'Branches and tags are refs (names for commit ids). <b>HEAD</b> normally points to a branch.',
        'Detached HEAD = HEAD points to a commit. Look around freely; name new work with <code>git switch -c</code> before leaving.',
        '<code>git reflog</code> and <code>git branch &lt;name&gt; &lt;id&gt;</code> recover deleted branches and bad resets.'
      ] }
    ] }
  ],
  questions: [
    { id: 'e2-q-objects', type: 'match', prompt: 'Match each Git object to what it stores.',
      pairs: [['blob', 'the content of one file'], ['tree', 'a list of file names pointing to blobs and other trees'], ['commit', 'a tree, parent, author and message']], explain: 'Blobs hold file content only; trees add names and folders; commits add history and the message.' },
    { id: 'e2-q-fill-type', type: 'fill', prompt: 'Complete the command that prints the <em>type</em> of the commit HEAD points to.', text: '[[a]]',
      answer: { a: ['git cat-file -t HEAD'] }, hints: ['The type flag is -t.'], explain: '<code>-t</code> prints the type (commit); <code>-p</code> pretty-prints the content.' },
    { id: 'e2-q-head', type: 'mc', prompt: 'You are on branch <code>main</code> and make a commit. What moves?',
      options: ['Only HEAD', '<code>main</code> moves to the new commit, and HEAD still points to <code>main</code>', 'Nothing until you push'],
      answer: 1, explain: 'HEAD points to the branch, and the branch ref moves forward to the new commit.' },
    { id: 'e2-q-detached', type: 'mc', prompt: 'You are in detached HEAD and made a commit. What should you do before switching away?',
      options: ['Nothing, Git remembers it on main', 'Create a branch: <code>git switch -c rescue</code>', 'Run <code>git reflog</code> and delete the entry'],
      answer: 1, explain: 'A detached commit belongs to no branch. A new branch gives it a name so it stays easy to find.' },
    { id: 'e2-q-recover', type: 'order', prompt: 'Put the recovery of a deleted branch in order.',
      items: ['Run <code>git reflog</code>', 'Find the last commit of the lost branch and note its id', 'Run <code>git branch &lt;name&gt; &lt;id&gt;</code>', 'Check with <code>git log --oneline</code>'], explain: 'You must see the ids first (reflog), pick the right commit, create the branch, then verify.' }
  ]
});
