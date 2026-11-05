/* i6 = 2.6 Issues, labels and project boards (github.com simulator). The simulator has issues, labels, assignees,
 * milestones and closing keywords, but NO project boards: boards are taught with a figure and text. */
(function () {
  var SLUG = 'hamk-projects/thesis-aino';
  function repo(w) { return w.server.repos[SLUG]; }
  function issues(w) { return repo(w).issues; }
  function issue(w, n) { return issues(w).filter(function (i) { return i.num === n; })[0]; }

  var WORLD = {
    me: 'aino', myName: 'Aino Student', config: { 'user.name': 'Aino Student', 'user.email': 'aino@example.com' },
    users: { teacher: { name: 'Tiina Teacher' }, ben: { name: 'Ben Student' } },
    orgs: { 'hamk-projects': { displayName: 'HAMK Projects', owners: ['teacher'], members: ['aino', 'ben'], settings: { basePermission: 'read' }, teams: {} } },
    remotes: {
      'hamk-projects/thesis-aino': {
        description: 'Aino\'s bachelor thesis', collaborators: { aino: 'write', ben: 'read' },
        milestones: ['Draft 1', 'Final version'],
        commits: [
          { msg: 'Initial commit', author: 'teacher', files: { 'README.md': '# Thesis Aino\n\nBachelor thesis about energy use in schools.\n' } },
          { msg: 'Add outline', author: 'aino', files: { 'outline.md': '# Outline\n\n1. Introduction\n2. Method\n3. Results\n' } }
        ],
        branches: { 'add-abstract': [{ msg: 'Write abstract', author: 'aino', files: { 'abstract.md': '# Abstract\n\nThis thesis studies energy use in schools.\n' } }] },
        issues: [{ title: 'Abstract is missing', body: 'The thesis has no abstract yet. Please add one before Draft 1.', author: 'teacher', labels: ['feedback'], assignees: ['aino'] }]
      }
    },
    run: []
  };

  TDC.registerTopic({
    id: 'i6',
    title: 'Issues, labels and project boards',
    subtitle: 'Keep a to-do list for a project where everyone can see it, discuss it and tick it off.',
    audience: 'students and staff who work in a team or give feedback',
    objectives: [
      'tell an issue from a pull request and choose the right one',
      'write an issue that others can act on, with a label, an assignee and a milestone',
      'mention people with @name and link work with #number',
      'close an issue automatically from a pull request with a keyword such as "Fixes #1"',
      'explain what a project board is and how its columns work'
    ],
    glossary: {
      issue: { term: 'issue', def: 'A numbered note in a repository for a task, question, bug or piece of feedback. It has a title, a description, comments and a status: open or closed.' },
      label: { term: 'label', def: 'A coloured tag on an issue or pull request, for example <code>bug</code> or <code>feedback</code>, used to sort and filter.' },
      milestone: { term: 'milestone', def: 'A goal with a name (and optionally a due date) that groups issues, for example "Draft 1". GitHub shows how many of its issues are closed.' },
      projectboard: { term: 'project board', def: 'A GitHub Project shown as columns such as Todo, In Progress and Done. Each card is an issue or pull request that you move across.' }
    },
    commands: [],
    sections: [
      { id: 'i6-what', title: 'What is an issue?', blocks: [
        { id: 'i6-what-t', type: 'text', html: '<p>An <dfn data-term="issue">issue</dfn> is a numbered note about something that needs attention: a task, a question, a mistake or a piece of feedback. It lives in the repository, next to the files it talks about. Anyone who can see the repository can read it, and people with access can answer. Nothing is lost in an email thread or a chat that scrolls away.</p>' },
        { id: 'i6-what-tbl', type: 'table', head: ['', 'Issue', 'Pull request'], rows: [
          ['Purpose', 'Talk about <b>what</b> should happen', 'Propose and review <b>the change itself</b>'],
          ['Contains', 'Description and comments', 'Changed files, commits and review'],
          ['Ends with', 'Closed (done, or not needed)', 'Merged (or closed without merging)'],
          ['Example', '"Abstract is missing"', 'The new file <code>abstract.md</code>']
        ], caption: 'Issues and pull requests share one numbering: if #1 is an issue, the next pull request is #2.', compact: true },
        { id: 'i6-what-c', type: 'callout', kind: 'school', title: 'Feedback without editing', html: 'A supervisor can read a thesis repository and write issues such as "Add a source for the figure on page 4" without touching the files. The student answers in the same place and closes the issue when it is fixed. Everything stays in the school\'s organization when the project ends.' },
        { id: 'i6-q-vs-blk', type: 'question', q: 'i6-q-vs' }
      ] },
      { id: 'i6-write', title: 'Write an issue, with label, assignee and milestone', blocks: [
        { id: 'i6-write-t', type: 'text', html: '<p>Open the <b>Issues</b> tab and click <b>New issue</b>. A good issue can be understood by someone who was not in your meeting:</p>' },
        { id: 'i6-write-l', type: 'list', items: [
          '<b>Title</b>: short and specific. "Abstract is missing" beats "Problem".',
          '<b>Description</b>: what is wrong or needed, where, and what "done" looks like. You can use Markdown (lesson 2.7).',
          '<b>Assignees</b>: the person who will do it.',
          '<b>Labels</b>: tags such as <code>bug</code>, <code>documentation</code>, <code>question</code> or <code>feedback</code>.',
          '<b>Milestone</b>: the goal it belongs to, for example "Draft 1".'
        ] },
        { id: 'i6-write-ex', type: 'example', title: 'A weak and a good issue', problem: 'Ben reads Aino\'s outline and wants to tell her something.', steps: [
          'Weak title: <b>Fix this</b>. Nobody knows what "this" is.',
          'Better title: <b>Method chapter has no sources</b>.',
          'Description: <i>Chapter 2 describes the survey but does not say where the questions came from. Please add a source or explain that you wrote them yourself.</i>',
          'Sidebar: assignee <b>aino</b>, label <b>documentation</b>, milestone <b>Draft 1</b>.'
        ], result: 'Aino sees exactly what to do, by when, and the supervisor can filter all "Draft 1" issues.' },
        { id: 'i6-write-c', type: 'callout', kind: 'info', title: 'Who may set labels and assignees?', html: 'Anyone with <b>Read</b> access can open an issue and comment. Setting labels, assignees and milestones needs <b>Triage</b> or higher (lesson 3.2 explains the roles). The simulator shows the sidebar pickers only if your role allows it.' },        { id: 'i6-write-gh', type: 'interactive', widget: 'github', title: 'Create an issue with a label and an assignee, then comment and add a milestone',
          caption: 'You are Aino. The repository already has issue #1 from your supervisor. Use the Issues tab.',
          config: {
            world: WORLD, start: '/' + SLUG + '/issues', personas: ['aino', 'teacher'],
            tasks: [
              { id: 'new', text: 'Create a <b>new issue</b> with a title, at least one <b>label</b> and an <b>assignee</b>',
                check: function (w) { return issues(w).some(function (i) { return i.num > 1 && i.title && i.labels.length > 0 && i.assignees.length > 0; }); },
                hint: 'On the Issues tab click New issue. Use the Labels and Assignees boxes on the right, then Create.',
                solution: 'Issues → New issue → type a title → Assignees: aino → Labels: documentation → Create' },
              { id: 'comment', text: 'Write a <b>comment</b> on issue #1',
                check: function (w) { var i = issue(w, 1); return !!i && i.comments.length > 0; },
                hint: 'Open the issue by clicking its title; the comment box is at the bottom.',
                solution: 'Open issue #1 → type "I will add it this week." → Comment' },
              { id: 'milestone', text: 'Put issue #1 into the milestone <b>Draft 1</b>',
                check: function (w) { var i = issue(w, 1); return !!i && i.milestone === 'Draft 1'; },
                hint: 'Open issue #1 and look at the Milestone box in the right-hand column.',
                solution: 'Open issue #1 → Milestone → Draft 1' }
            ]
          } }
      ] },
      { id: 'i6-link', title: 'Mentions, references and closing keywords', blocks: [
        { id: 'i6-link-t', type: 'text', html: '<p>Three small pieces of syntax connect people and work. They work in issue and pull request descriptions and in comments:</p>' },
        { id: 'i6-link-tbl', type: 'table', head: ['Write', 'What happens'], rows: [
          ['<code>@ben</code>', '<b>Mention</b>: Ben gets a notification, even if he has not opened the issue.'],
          ['<code>#12</code>', '<b>Reference</b>: becomes a link to issue or pull request 12, and 12 shows a back-link.'],
          ['<code>Fixes #12</code>', '<b>Closing keyword</b>: when the pull request is merged into the default branch, issue 12 closes by itself.']
        ], caption: 'Other closing words: close, closes, closed, fix, fixed, resolve, resolves, resolved.', compact: true },
        { id: 'i6-link-c', type: 'callout', kind: 'warn', title: 'Only a merge closes the issue', html: 'The keyword does nothing while the pull request is open. It also only works when the pull request is merged into the repository\'s <b>default branch</b>, usually <code>main</code>. Writing "Fixes #12" in a commit message on a side branch does not close it until that work reaches the default branch.' },        { id: 'i6-link-t2', type: 'text', html: '<p>Try the whole loop: branch <code>add-abstract</code> already holds Aino\'s abstract. Open a pull request for it that says <code>Fixes #1</code>, then merge it and watch issue #1 close. (Pull requests are lesson 2.5; the steps are in the hint.)</p>' },
        { id: 'i6-link-gh', type: 'interactive', widget: 'github', title: 'Close an issue with "Fixes #1" in a pull request',
          caption: 'You are Aino, with Write access, so you may merge your own pull request in this repository.',
          config: {
            world: WORLD, start: '/' + SLUG, personas: ['aino', 'teacher'],
            tasks: [
              { id: 'pr', text: 'Open a <b>pull request</b> from <code>add-abstract</code> whose description contains <b>Fixes #1</b>',
                check: function (w) { return repo(w).pulls.some(function (p) { return p.head === 'add-abstract' && /fixes #1\b/i.test(p.title + ' ' + p.body); }); },
                hint: 'Pull requests → New pull request. Compare: add-abstract. Write "Fixes #1" in the description.',
                solution: 'Pull requests → New pull request → compare add-abstract → description: Fixes #1 → Create pull request' },
              { id: 'merge', text: '<b>Merge</b> the pull request',
                check: function (w) { return repo(w).pulls.some(function (p) { return p.state === 'merged' && /fixes #1\b/i.test(p.title + ' ' + p.body); }); },
                hint: 'Open the pull request and use the green merge button, then confirm.',
                solution: 'Merge pull request → Confirm merge' },
              { id: 'closed', text: 'Check that issue <b>#1 closed by itself</b>',
                check: function (w) { var i = issue(w, 1); return !!i && i.state === 'closed' && repo(w).pulls.some(function (p) { return p.state === 'merged'; }); },
                hint: 'It happens when you merge; open the Issues tab and look at the Closed list.',
                solution: 'Issues → Closed' }
            ]
          } },
        { id: 'i6-q-fix-blk', type: 'question', q: 'i6-q-fix' }
      ] },
      { id: 'i6-sort', title: 'Labels and milestones keep order', blocks: [
        { id: 'i6-sort-t', type: 'text', html: '<p>With five issues you can read them all. With fifty you need to filter. Two tools do that:</p>' },
        { id: 'i6-sort-l', type: 'list', items: [
          '<dfn data-term="label">Labels</dfn> describe the <b>kind</b> of work. New repositories start with a standard set: <code>accessibility</code>, <code>bug</code>, <code>documentation</code>, <code>duplicate</code>, <code>enhancement</code>, <code>good first issue</code>, <code>help wanted</code>, <code>invalid</code>, <code>question</code> and <code>wontfix</code>. People with Triage access or higher can create your own, for example <code>feedback</code> or <code>needs-source</code>.',          '<dfn data-term="milestone">Milestones</dfn> describe <b>when</b> or <b>for which goal</b>: "Draft 1", "Final version", "Week 12". The milestone page shows a progress bar of closed against open issues.'
        ] },
        { id: 'i6-sort-c', type: 'callout', kind: 'tip', title: 'Keep the label list short', html: 'Five to eight labels that everyone understands work better than thirty. Agree on them at the start and write them in the README.' },
        { id: 'i6-q-label-blk', type: 'question', q: 'i6-q-label' }
      ] },
      { id: 'i6-board', title: 'Project boards', blocks: [
        { id: 'i6-board-t', type: 'text', html: '<p>A list of issues says what exists. A <dfn data-term="projectboard">project board</dfn> says <b>where each one stands</b>. GitHub calls this feature <b>Projects</b>. A project can show the same items as a <b>Table</b>, a <b>Board</b> or a <b>Roadmap</b>; the Board view looks like sticky notes on a wall.</p>' },
        { id: 'i6-board-fig', type: 'figure', alt: 'A project board with three columns: Todo has two cards, In Progress has one card, Done has one card.', caption: 'A board with the usual three columns. Moving a card to another column changes its Status.',
          svg: '<svg viewBox="0 0 360 150" role="img" aria-hidden="true" style="width:100%;max-width:560px;font:12px sans-serif">' +
            ['Todo', 'In Progress', 'Done'].map(function (c, i) {
              var x = 8 + i * 118, cards = [['Add sources #3', 'Fix figure #5'], ['Write abstract #1'], ['Outline #2']][i];
              return '<rect x="' + x + '" y="6" width="112" height="138" rx="6" fill="none" stroke="currentColor" opacity=".5"/><text x="' + (x + 8) + '" y="24" fill="currentColor" font-weight="bold">' + c + '</text>' +
                cards.map(function (t, j) { return '<rect x="' + (x + 8) + '" y="' + (34 + j * 40) + '" width="96" height="32" rx="4" fill="none" stroke="currentColor"/><text x="' + (x + 14) + '" y="' + (54 + j * 40) + '" fill="currentColor" font-size="10.5">' + t + '</text>'; }).join('');
            }).join('') + '</svg>' },
        { id: 'i6-board-l', type: 'list', items: [
          'A new project\'s board starts with the columns <b>Todo</b>, <b>In Progress</b> and <b>Done</b>. They are the values of a field called <b>Status</b>, and you can rename or add values.',          'Add issues and pull requests as cards with <b>Add item</b> (or the <b>+</b> in a column). Drag a card to another column, or change its Status.',
          'Projects belong to a user or to an <b>organization</b>, not to one repository, so one board can follow issues from several repositories. In the school organization that means one board per course or thesis group that everyone can read.',
          'Built-in workflows can do routine moves: closing an issue sets its Status to Done, and merging a pull request does the same.'        ] },
        { id: 'i6-board-c', type: 'callout', kind: 'info', title: 'Not in the simulator', html: 'The practice window above has issues, labels, assignees and milestones, but <b>no project boards</b>. On github.com open the <b>Projects</b> tab of your organization or repository and choose <b>New project</b>, then pick the <b>Board</b> template.' },        { id: 'i6-board-c2', type: 'callout', kind: 'tip', title: 'Issue or board?', html: 'Use issues for the detail and the discussion. Use the board only for the overview at a weekly meeting. If a group of three does not need an overview, a milestone and a few labels are enough.' },
        { id: 'i6-q-board-blk', type: 'question', q: 'i6-q-board' }
      ] },
      { id: 'i6-tpl', title: 'Issue templates', blocks: [
        { id: 'i6-tpl-t', type: 'text', html: '<p>When many people open issues, they forget details. An <b>issue template</b> pre-fills the description with questions. You create it with a file in the repository, so it is versioned like everything else:</p>' },
        { id: 'i6-tpl-code', type: 'code', lang: 'markdown', title: '.github/ISSUE_TEMPLATE/feedback.md', code: '---\nname: Thesis feedback\nabout: Comment on a chapter\nlabels: feedback\n---\n\n**Chapter and page**\n\n**What should change?**\n\n**Why?**\n' },        { id: 'i6-tpl-t2', type: 'text', html: '<p>Next time someone clicks <b>New issue</b>, GitHub offers "Thesis feedback" and fills in the questions and the <code>feedback</code> label. A file in a folder named <code>.github</code> at the top of the repository is all it takes. The simulator does not show templates; you will meet them on github.com.</p>' },
        { id: 'i6-q-tpl-blk', type: 'question', q: 'i6-q-tpl' }
      ] },
      { id: 'i6-summary', title: 'Summary', blocks: [
        { id: 'i6-sum-l', type: 'list', items: [
          'An <b>issue</b> discusses what should happen; a <b>pull request</b> proposes the change.',
          'A good issue has a specific title, a clear description, an assignee, labels and a milestone.',
          '<code>@name</code> notifies a person, <code>#12</code> links to item 12, and <code>Fixes #12</code> in a merged pull request closes issue 12.',
          'Labels say what kind of work; milestones say for which goal.',
          'A <b>project board</b> shows each item\'s status in columns (Todo, In Progress, Done). It lives on user or organization level.',
          'Issue templates are Markdown files under <code>.github/ISSUE_TEMPLATE/</code>.'
        ] }
      ] }
    ],
    questions: [
      { id: 'i6-q-vs', type: 'mc', prompt: 'Your supervisor wants you to add a source to chapter 2, but has not changed any file. What should the supervisor open?',
        options: ['A pull request, because it is about the thesis', 'An issue, because it describes work that still has to be done', 'A new branch', 'A new repository'],
        answer: 1, hints: ['Which of the two contains changed files?'], explain: 'An <b>issue</b> describes the work. A pull request is only needed when someone has already changed files and wants a review of that change.' },
      { id: 'i6-q-fix', type: 'multi', prompt: 'Which of these will close issue #7 automatically when the pull request is merged into <code>main</code>? (Choose all that apply.)',
        options: ['Description: <code>Fixes #7</code>', 'Description: <code>Closes #7</code>', 'Description: <code>See #7</code>', 'Description: <code>Resolved #7</code>'],
        answer: [0, 1, 3], hints: ['One of them only links, it does not close.'], explain: 'Fix, close and resolve (in their different forms) are closing keywords. <code>See #7</code> only creates a link; the issue stays open.' },
      { id: 'i6-q-label', type: 'match', prompt: 'Match each need to the best tool.',
        pairs: [['Show which issues are feedback and which are bugs', 'Labels'], ['Group everything that must be ready for the first draft', 'Milestone'], ['Make clear who will do the task', 'Assignee'], ['Tell Ben about a comment without waiting for him to look', '@ben mention']],
        explain: 'Labels = kind of work, milestone = goal or date, assignee = owner, mention = notification.' },
      { id: 'i6-q-board', type: 'order', prompt: 'Put the steps of an issue on a board in a natural order.',
        items: ['The issue is created and its card appears in Todo', 'Someone starts work and moves the card to In Progress', 'The pull request is merged', 'The issue closes and the card is in Done'],
        explain: 'Cards move from Todo to In Progress to Done; the built-in workflows can move the last step for you.' },
      { id: 'i6-q-tpl', type: 'fill', prompt: 'Complete the folder name.', text: 'Issue templates are stored in the folder [[a]]/ISSUE_TEMPLATE at the top of the repository.',
        answer: { a: ['.github', '.github/'] }, hints: ['The folder name starts with a dot and mentions the website.'], explain: 'The folder is <code>.github</code>. The files inside are ordinary files, so templates have a history like everything else.' }
    ]
  });
}());
