/* i3 = 2.3 Merge conflicts (git track). Terminal simulator (conflict + auto-merge), then VS Code (Accept Current/Incoming/Both). */
(function () {
  var CFG = { 'user.name': 'Aino Student', 'user.email': 'aino@example.com', 'init.defaultBranch': 'main' };
  // abstract.md: both branches change the SAME line (conflict). notes.md: they change DIFFERENT lines (merges by itself).
  var SETUP = ['git init', 'git add .', 'git commit -m "Start thesis"', 'git switch -c supervisor-edits',
    'echo "# Abstract\nTitle: Playing to learn\nMethod: survey" > abstract.md',
    'echo "# Notes\nInterviews: planned\nLiterature: read\nSurvey: drafted\nEthics: approved" > notes.md',
    'git commit -am "Supervisor suggests a new title"', 'git switch main',
    'echo "# Abstract\nTitle: Game-based learning\nMethod: survey" > abstract.md',
    'echo "# Notes\nInterviews: done\nLiterature: read\nSurvey: drafted\nEthics: pending reply" > notes.md',
    'git commit -am "Update title and interviews"'];
  function files() { return { '~/thesis/abstract.md': '# Abstract\nTitle: Games in learning\nMethod: survey\n', '~/thesis/notes.md': '# Notes\nInterviews: planned\nLiterature: read\nSurvey: drafted\nEthics: pending reply\n' }; }
  function hasMarkers(t) { return /^(<<<<<<<|=======|>>>>>>>)/m.test(t || ''); }
  function merged(w) { var r = w.repo(); var c = r && w.commitsOn(r, 'main')[0]; return !!c && !r.merge && c.parents.length === 2; }
  function clean(w, f) { var r = w.repo(); return !!r && f in w.workTree(r) && !hasMarkers(w.workTree(r)[f]); }

  TDC.registerTopic({
    id: 'i3',
    title: 'Merge conflicts',
    subtitle: 'Why conflicts happen, how to read the markers, and how to resolve them in the terminal and in VS Code.',
    audience: 'everyone who merges with Git · after lesson 2.2',
    objectives: ['explain when Git can merge by itself and when it asks you to decide', 'read the conflict markers in a file',
      'resolve a conflict by editing the file, then git add and git commit', 'abort a merge with git merge --abort',
      'resolve a conflict in VS Code with Accept Current / Incoming / Both Change', 'avoid conflicts by pulling often and committing small'],
    glossary: {
      conflict: { term: 'merge conflict', def: 'A merge where both branches changed the same lines. Git cannot know which version you want, so it stops and asks you to choose.' },
      merge: { term: 'merge', def: 'Bring the commits of another branch into the branch you are on.' },
      head: { term: 'HEAD', def: 'Git’s “you are here” marker. Normally it points at the branch you are on, and that branch points at its latest commit.' }
    },
    commands: [
      { cmd: 'git status', does: 'During a merge: list the files with conflicts (“both modified”)' },
      { cmd: 'git add <file>', does: 'Tell Git the conflict in this file is resolved' },
      { cmd: 'git commit', does: 'Finish the merge once every conflict is resolved' },
      { cmd: 'git merge --abort', does: 'Cancel the merge and go back to before it started' }
    ],
    sections: [
      { id: 'i3-why', title: 'When do conflicts happen?', blocks: [
        { id: 'i3-why-t', type: 'text', html: '<p>Aino and her supervisor both edit the abstract. Aino changes the title on <code>main</code>. Her supervisor changes the <em>same title line</em> on the branch <code>supervisor-edits</code>. When Aino merges, Git has two different versions of one line and no way to know which is better. That is a <dfn data-term="conflict">merge conflict</dfn>.</p>' },
        { id: 'i3-why-tab', type: 'table', head: ['Both branches changed…', 'Result'],
          rows: [['different files', 'Git merges by itself'], ['different lines of the same file', 'Git merges by itself'], ['the <b>same lines</b> of the same file', '<b>Conflict</b>: you decide']] },
        { id: 'i3-why-c', type: 'callout', kind: 'key', title: 'Key idea', html: 'A conflict is not an error and nothing is lost. Git pauses the merge and asks a person to make a choice that only a person can make.' },
        { id: 'i3-why-q', type: 'question', q: 'i3-q-when' }
      ] },
      { id: 'i3-markers', title: 'Reading the markers', blocks: [
        { id: 'i3-mk-t', type: 'text', html: '<p>When a merge stops, Git writes <b>both</b> versions into the file, with markers around them. Everything between <code>&lt;&lt;&lt;&lt;&lt;&lt;&lt;</code> and <code>=======</code> is your side (<dfn data-term="head">HEAD</dfn>, the branch you are on). Everything between <code>=======</code> and <code>&gt;&gt;&gt;&gt;&gt;&gt;&gt;</code> comes from the branch you merge in.</p>' },
        { id: 'i3-mk-code', type: 'code', lang: 'text', title: 'abstract.md during the conflict', code: '# Abstract\n<<<<<<< HEAD\nTitle: Game-based learning\n=======\nTitle: Playing to learn\n>>>>>>> supervisor-edits\nMethod: survey' },
        { id: 'i3-mk-t2', type: 'text', html: '<p>To resolve it, edit the file so it contains exactly the text you want, and <b>delete the three marker lines</b>. You can keep one side, the other, both, or write something new.</p>' },
        { id: 'i3-mk-q', type: 'question', q: 'i3-q-markers' }
      ] },
      { id: 'i3-resolve', title: 'Resolve a conflict in the terminal', blocks: [
        { id: 'i3-rs-list', type: 'list', ordered: true, steps: ['<code>git merge supervisor-edits</code>: Git reports <code>CONFLICT</code> and stops.', '<code>git status</code>: files under <b>Unmerged paths</b> need your attention.', 'Open each file, remove the markers and keep the text you want.', '<code>git add &lt;file&gt;</code>: marks the file as resolved.', '<code>git commit</code>: finishes the merge with a merge commit.'] },
        { id: 'i3-rs-c', type: 'callout', kind: 'info', html: 'In this simulator <code>code abstract.md</code> opens a small built-in editor. On your own computer it opens VS Code (or use any text editor). Real Git also opens an editor for the merge message when you run <code>git commit</code> without <code>-m</code>; the simulator accepts the suggested message.' },
        { id: 'i3-sim1', type: 'interactive', widget: 'terminal', title: 'Merge, find the conflict and fix it',
          caption: 'Both branches already have commits. Notice that <code>notes.md</code> merges by itself because the edits are on different lines; only <code>abstract.md</code> conflicts.',
          config: {
            world: { config: CFG, cwd: '~/thesis', files: files(), run: SETUP },
            panels: ['areas', 'graph'],
            tasks: [
              { id: 'merge', text: 'You are on <code>main</code>. Merge <code>supervisor-edits</code> and read the message: Git reports a conflict', hint: 'git merge supervisor-edits',
                check: function (w) { var r = w.repo(); return !!r && !!r.merge && r.merge.conflicts.indexOf('abstract.md') >= 0; }, solution: 'git merge supervisor-edits' },
              { id: 'auto', text: 'Run <code>git status</code>: only <code>abstract.md</code> is unmerged. <code>notes.md</code> already holds both edits', hint: 'Compare with: cat notes.md',
                check: function (w) { var r = w.repo(), n = r && w.workTree(r)['notes.md'] || ''; return !!r && !!r.merge && r.merge.conflicts.length === 1 && w.ran(/^git status/) && /Interviews: done/.test(n) && /Ethics: approved/.test(n); }, solution: 'git status' },
              { id: 'fix', text: 'Open <code>abstract.md</code> with <code>code abstract.md</code>, remove the markers and keep one title, then save', hint: 'Delete the lines starting with <<<<<<<, ======= and >>>>>>>, and one of the two Title lines.',
                check: function (w) { var r = w.repo(); return !!r && !!r.merge && clean(w, 'abstract.md') && /Title:/.test(w.workTree(r)['abstract.md']); },
                solution: 'echo "# Abstract\\nTitle: Playing to learn\\nMethod: survey" > abstract.md   (or edit the file with code abstract.md)' },
              { id: 'add', text: 'Mark it as resolved with <code>git add abstract.md</code>', hint: 'git add abstract.md',
                check: function (w) { var r = w.repo(); return !!r && !!r.merge && r.merge.conflicts.length === 0; }, solution: 'git add abstract.md' },
              { id: 'commit', text: 'Finish the merge with <code>git commit</code>', hint: 'The suggested message is fine.',
                check: function (w) { return merged(w) && clean(w, 'abstract.md'); }, solution: 'git commit -m "Merge supervisor-edits"' }
            ]
          } },
        { id: 'i3-rs-c2', type: 'callout', kind: 'tip', title: 'Changed your mind?', html: '<code>git merge --abort</code> cancels the merge and puts your files back exactly as they were before. You can try again later.' },
        { id: 'i3-rs-q', type: 'question', q: 'i3-q-steps' },
        { id: 'i3-rs-q2', type: 'question', q: 'i3-q-abort' }
      ] },
      { id: 'i3-vscode', title: 'Resolve a conflict in VS Code', blocks: [
        { id: 'i3-vs-t', type: 'text', html: '<p>VS Code recognises the markers and shows three links above each conflict. They save you from editing the markers by hand.</p>' },
        { id: 'i3-vs-tab', type: 'table', head: ['Link', 'Keeps'], rows: [['<b>Accept Current Change</b>', 'your side (the branch you are on)'], ['<b>Accept Incoming Change</b>', 'the side from the branch you merged in'], ['<b>Accept Both Changes</b>', 'both versions, one after the other']] },
        { id: 'i3-vs-tabs', type: 'tabs', group: 'tool', tabs: [
          { label: 'Terminal', icon: '⌨️', blocks: [{ id: 'i3-vs-term', type: 'text', html: '<p>Edit the file by hand as in the last section, then <code>git add</code> and <code>git commit</code>.</p>' }] },
          { label: 'VS Code', icon: '🧩', blocks: [{ id: 'i3-vs-code', type: 'list', ordered: true, steps: ['In <b>Source Control</b>, the file is listed under <b>Merge Changes</b>. Click it to open it.', 'Click <b>Accept Current Change</b>, <b>Accept Incoming Change</b> or <b>Accept Both Changes</b> above the conflict.', 'Save the file (<kbd>Ctrl</kbd>+<kbd>S</kbd>).', 'Click <b>+</b> next to the file to stage it.', 'Click <b>Commit</b> (the message is already filled in).'] }] }
        ] },
        { id: 'i3-sim2', type: 'interactive', widget: 'gitgui', title: 'Resolve a conflict in VS Code',
          caption: 'The merge has already been started for you. Resolve the conflict in the editor and finish the merge. The simulator’s editor is a plain text box with the Accept links on top.',
          config: {
            skin: 'vscode', folder: '~/thesis', panels: ['graph'],
            world: { config: CFG, cwd: '~/thesis', files: { '~/thesis/discussion.md': '# Discussion\nMain finding: students liked games\nLimits: small sample\n' },
              run: ['git init', 'git add .', 'git commit -m "Start discussion"', 'git switch -c supervisor-edits',
                'echo "# Discussion\nMain finding: games raised motivation\nLimits: small sample" > discussion.md', 'git commit -am "Sharper main finding"', 'git switch main',
                'echo "# Discussion\nMain finding: games raised motivation and grades\nLimits: small sample" > discussion.md', 'git commit -am "Mention grades"', 'git merge supervisor-edits'] },
            tasks: [
              { id: 'accept', text: 'Open <code>discussion.md</code> from <b>Merge Changes</b>, click <b>Accept Both Changes</b>, then delete the extra <code>Main finding</code> line so one remains. Save with <b>Save</b> or <kbd>Ctrl</kbd>+<kbd>S</kbd>', hint: 'Accept Current/Incoming keep only one side; Both keeps both lines for you to tidy.',
                check: function (w) { var r = w.repo(); return !!r && !!r.merge && clean(w, 'discussion.md') && (w.workTree(r)['discussion.md'].match(/^Main finding/gm) || []).length === 1; }, solution: 'Click Accept Both Changes, delete one of the two Main finding lines, then Save.' },
              { id: 'stage', text: 'Stage the file with <b>+</b>', hint: 'The + appears next to the file under Merge Changes.',
                check: function (w) { var r = w.repo(); return !!r && !!r.merge && r.merge.conflicts.length === 0; }, solution: 'Click + next to discussion.md.' },
              { id: 'commit', text: 'Click <b>Commit</b> to finish the merge', hint: 'The merge message is filled in.',
                check: function (w) { return merged(w) && clean(w, 'discussion.md'); }, solution: 'Click Commit.' }
            ]
          } },
        { id: 'i3-vs-q', type: 'question', q: 'i3-q-accept' }
      ] },
      { id: 'i3-prevent', title: 'Fewer conflicts', blocks: [
        { id: 'i3-pv-t', type: 'text', html: '<p>You cannot avoid every conflict, but you can make them rare and small.</p>' },
        { id: 'i3-pv-l', type: 'list', items: ['<b>Pull often.</b> The longer you wait, the more the other person’s work drifts from yours.', '<b>Commit small and merge soon.</b> Short-lived branches touch fewer lines.', '<b>Talk first.</b> If two people must edit the same paragraph, agree who goes first.', '<b>Keep files small.</b> One chapter per file is easier than one huge document.'] },
        { id: 'i3-pv-c', type: 'callout', kind: 'warn', html: 'Never commit a file that still has <code>&lt;&lt;&lt;&lt;&lt;&lt;&lt;</code> markers in it. Git would accept it, because it is just text, but your document would contain the markers. Search the file for them before <code>git add</code>.' },
        { id: 'i3-pv-q', type: 'question', q: 'i3-q-prevent' }
      ] },
      { id: 'i3-summary', title: 'Summary', blocks: [
        { id: 'i3-sum', type: 'list', items: ['A conflict happens when both branches changed the <b>same lines</b>. Different lines or files merge by themselves.', 'Markers: <code>&lt;&lt;&lt;&lt;&lt;&lt;&lt;</code> your side, <code>=======</code>, <code>&gt;&gt;&gt;&gt;&gt;&gt;&gt;</code> the other side.', 'Resolve: edit the file, remove the markers, <code>git add</code>, <code>git commit</code>.', '<code>git merge --abort</code> cancels the merge safely.', 'VS Code: <b>Accept Current / Incoming / Both Changes</b>, save, stage with +, commit.', 'Pull often and commit small to avoid conflicts.'] }
      ] }
    ],
    questions: [
      { id: 'i3-q-when', type: 'mc', prompt: 'Which merge ends in a conflict?', options: ['One branch edited line 2 of a file, the other edited line 20 of the same file', 'One branch added a new file, the other did not', 'Both branches edited the same line of the same file differently', 'Both branches are identical'], answer: 2, hints: ['Think about when Git cannot choose.'], explain: 'Git can combine changes in different places. Two different edits to the same line need a human decision.' },
      { id: 'i3-q-markers', type: 'mc', prompt: 'In a conflicted file, what is between <code>=======</code> and <code>&gt;&gt;&gt;&gt;&gt;&gt;&gt; supervisor-edits</code>?', options: ['Your version, from the branch you are on', 'The version from supervisor-edits', 'The old version both branches started from', 'Text Git added as a comment'], answer: 1, explain: 'Above <code>=======</code> is HEAD (your branch); below it is the incoming branch.' },
      { id: 'i3-q-steps', type: 'order', prompt: 'Put the steps of resolving a conflict in order.', items: ['<code>git merge supervisor-edits</code> reports a conflict', 'Edit the file and remove the markers', '<code>git add abstract.md</code>', '<code>git commit</code>'], explain: 'Merge, fix the file, mark it resolved, then commit.' },
      { id: 'i3-q-abort', type: 'fill', prompt: 'Complete the command.', text: 'You started a merge but want to cancel it: git merge [[a]]', answer: { a: ['--abort'] }, explain: '<code>git merge --abort</code> returns to the state before the merge.' },
      { id: 'i3-q-accept', type: 'match', prompt: 'Match each VS Code link to its result.', pairs: [['Accept Current Change', 'keeps the version from the branch you are on'], ['Accept Incoming Change', 'keeps the version from the merged-in branch'], ['Accept Both Changes', 'keeps both versions, one after the other']], explain: 'Current is HEAD (your side); incoming is the branch being merged.' },
      { id: 'i3-q-prevent', type: 'multi', prompt: 'Which habits make conflicts less likely?', options: ['Pull often', 'Commit small changes and merge soon', 'Keep one branch alive for months', 'Agree who edits which part'], answer: [0, 1, 3], explain: 'Frequent syncing and small changes keep branches close together. Long-lived branches drift apart.' }
    ]
  });
})();
