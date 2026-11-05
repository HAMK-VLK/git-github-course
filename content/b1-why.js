/* b1 = Why version control? (timeline widget: file chaos vs a history with messages). */
(function () {
  TDC.registerTopic({
    id: 'b1',
    title: 'Why version control?',
    subtitle: 'Meet the “final_v3_REAL” problem, and the tool that makes it disappear.',
    audience: 'everyone · no experience needed',
    objectives: [
      'describe the “final_v3” problem and why copying files is not a history',
      'define version control, repository, commit and history',
      'tell Git from GitHub',
      'explain why school projects belong in the school organization',
      'choose which lessons of this course you need'
    ],
    glossary: {
      vcs: { term: 'version control', def: 'A system that records every saved version of your files, with who changed what, when and why, so you can compare versions and go back to an earlier one.' },
      repository: { term: 'repository', def: 'A project folder that Git watches, together with its full history. Often shortened to <em>repo</em>.' },
      commit: { term: 'commit', def: 'One saved version (a snapshot) of the project in the history, with a short message, an author and a time.' },
      history: { term: 'history', def: 'The list of all commits in a repository, newest first. You can read it and return to any point in it.' },
      git: { term: 'Git', def: 'Free software on your own computer that records the history of a project. It works offline.' },
      github: { term: 'GitHub', def: 'A website that stores Git repositories online so that people can share, review and back up their work. It is a service built around Git, not Git itself.' }
    },
    commands: [],
    sections: [
      { id: 'b1-chaos', title: 'The folder full of “final” files', blocks: [
        { id: 'b1-chaos-t', type: 'text', html: '<p>You have probably seen this: <code>thesis_final.docx</code>, <code>thesis_final2.docx</code>, <code>thesis_final_REAL.docx</code>. Each copy is a way of saying “do not lose this version”. But the names say nothing about <em>what changed</em>, <em>who changed it</em> or <em>which one is newest</em>. Send a copy to your supervisor, get comments back, and soon there are two “latest” versions.</p><p><b><dfn data-term="vcs">Version control</dfn></b> solves this. You keep <em>one</em> file or folder, and a tool records each saved version in a <dfn data-term="history">history</dfn>. Every entry has a short message, an author and a time.</p>' },
        { id: 'b1-chaos-sim', type: 'interactive', widget: 'timeline', title: 'Slide back in time',
          caption: 'On the left, the folder you know. On the right, one file with its history. Drag the slider or press the numbered dots to read each version.',
          config: {
            chaos: ['thesis.docx', 'thesis_final.docx', 'thesis_final2.docx', 'thesis_final_REAL.docx', 'thesis_final_REAL_aino-comments.docx', 'thesis_v3 (copy).docx'],
            versions: [
              { msg: 'Start the abstract', author: 'Aino', when: 'Mon 09:12', text: '# Abstract\nThis thesis studies study habits.\n' },
              { msg: 'Add research question', author: 'Aino', when: 'Mon 14:40', text: '# Abstract\nThis thesis studies study habits.\nHow do first-year students plan their week?\n' },
              { msg: 'Fix wording after supervisor feedback', author: 'Tiina', when: 'Wed 10:05', text: '# Abstract\nThis thesis studies how students plan their time.\nHow do first-year students plan their week?\n' },
              { msg: 'Add method: survey of 120 students', author: 'Aino', when: 'Fri 16:30', text: '# Abstract\nThis thesis studies how students plan their time.\nHow do first-year students plan their week?\nMethod: an online survey of 120 students.\n' }
            ],
            tasks: [
              { id: 'back', text: 'Find the version where <b>Tiina</b> fixed the wording after feedback', check: function (s) { return !!(s.viewed && s.viewed[2]); }, hint: 'Read the messages: it is the third dot.', solution: 'Press dot 3.' },
              { id: 'all', text: 'Look at <b>all four</b> versions', check: function (s) { return s.count >= 4; }, hint: 'Press each numbered dot once.', solution: 'Press dots 1, 2, 3 and 4.' }
            ] } },
        { id: 'b1-chaos-c', type: 'callout', kind: 'key', title: 'What you just saw', html: 'Each saved version is called a <dfn data-term="commit">commit</dfn>. The messages tell the story of the work, and green and red lines show exactly what changed. Going back costs nothing: the newer versions are still there.' },
        { id: 'b1-q-chaos-blk', type: 'question', q: 'b1-q-chaos' }
      ] },
      { id: 'b1-git', title: 'What Git does', blocks: [
        { id: 'b1-git-t', type: 'text', html: '<p><dfn data-term="git">Git</dfn> is the most widely used version control tool. You install it once and it works on your own computer, <b>without internet</b>.</p><p>You tell Git to watch a folder. That folder, with its history, is a <dfn data-term="repository">repository</dfn>. When you reach a point worth keeping, you save a <b>commit</b>: Git stores a <em>snapshot</em> of the files as they are right now, plus your message, your name and the time.</p>' },
        { id: 'b1-git-l', type: 'list', items: [
          '<b>Snapshots, not copies of everything.</b> Git stores each version compactly, so a long history stays small.',
          '<b>Who, when, why.</b> Every commit records an author, a time and a message.',
          '<b>Local.</b> Your history lives on your computer. Nobody else sees it until you share it.',
          '<b>Works for any files.</b> It is made for code, but thesis chapters, notes and course material fit equally well. It is best with text; Word and PDF files are saved too, but Git cannot show line-by-line changes inside them.'
        ] },
        { id: 'b1-git-c', type: 'callout', kind: 'warn', title: 'Common mistake', html: 'A history on your laptop is not a backup. If the laptop is lost or breaks, the repository goes with it. That is one reason for the next section.' },
        { id: 'b1-q-git-blk', type: 'question', q: 'b1-q-laptop' }
      ] },
      { id: 'b1-github', title: 'What GitHub adds', blocks: [
        { id: 'b1-github-t', type: 'text', html: '<p><dfn data-term="github">GitHub</dfn> is a website that stores copies of repositories online. <b>Git is the tool; GitHub is a place to put repositories.</b> You can use Git without GitHub, but GitHub makes Git a team tool.</p>' },
        { id: 'b1-github-tbl', type: 'table', head: ['', 'Git', 'GitHub'], rows: [
          ['What is it?', 'Software on your computer', 'A website (a service)'],
          ['Needs internet?', 'No', 'Yes'],
          ['Main job', 'Record the history of your files', 'Share, review and back up repositories'],
          ['Extras', '—', 'Access control, reviews, issues, backup, project page'],
          ['Do you need an account?', 'No', 'Yes, a free one']
        ] },
        { id: 'b1-github-l', type: 'list', items: [
          '<b>A shared home.</b> Everyone with access works from the same online copy.',
          '<b>Collaboration.</b> Propose changes, discuss them and review each other’s work before it is accepted.',
          '<b>Backup.</b> The project survives a lost laptop.',
          '<b>Access control.</b> You decide who can read and who can change each project. A later lesson covers this in depth.'
        ] },
        { id: 'b1-q-vs-blk', type: 'question', q: 'b1-q-vs' }
      ] },
      { id: 'b1-outlive', title: 'Projects that outlive their authors', blocks: [
        { id: 'b1-outlive-t', type: 'text', html: '<p>A thesis or summer project is useful long after the person who wrote it has graduated or left. If it lives only on a personal laptop or a personal GitHub account, it leaves with them.</p>' },
        { id: 'b1-outlive-c', type: 'callout', kind: 'school', title: 'The school organization', html: 'HAMK keeps school projects in a GitHub <b>organization</b>, here the fictional <code>hamk-projects</code>. The organization, not a person, owns the repositories. When Aino graduates, <code>hamk-projects/thesis-aino</code> stays. When a teacher changes jobs, the course material stays with the course. Owners can remove a leaving person’s access without losing any work.' },
        { id: 'b1-outlive-l', type: 'list', items: [
          '<b>Students:</b> do your project inside the organization, not in a personal repository. You can still link to it in your CV.',
          '<b>Teachers and staff:</b> keep course material and shared documents there so the next person can continue.',
          '<b>Everyone:</b> your own private experiments can stay in your personal account.'
        ] },
        { id: 'b1-q-owner-blk', type: 'question', q: 'b1-q-home' }
      ] },
      { id: 'b1-paths', title: 'Which lessons you need', blocks: [
        { id: 'b1-paths-t', type: 'text', html: '<p>The course has Git lessons (the tool), GitHub lessons (the website) and a few that join the two. Pick the path that fits your role; you can always read more.</p>' },
        { id: 'b1-paths-tbl', type: 'table', head: ['You are…', 'Start with', 'Then'], rows: [
          ['<b>Staff</b> who stores documents and course material', 'GitHub account and organization, a tour of a repository, working in the browser', 'Roles and permissions, project hand-over'],
          ['<b>Teacher</b> who supervises projects', 'The same, plus roles and permissions', 'Pull requests and reviews, protected branches, offboarding'],
          ['<b>Student</b> doing a project or thesis', 'Install Git, your first repository, history, clone/push/pull', 'Branches, conflicts, pull requests, undoing mistakes'],
          ['<b>Experienced</b> developer', 'Skim the beginner lessons, then the school organization topics', 'Intermediate and advanced lessons']
        ], compact: true },
        { id: 'b1-paths-c', type: 'callout', kind: 'tip', title: 'No installation needed to begin', html: 'Every exercise runs in a practice copy of the tools inside this course. Nothing you do here can break a real project.' },
        { id: 'b1-q-flow-blk', type: 'question', q: 'b1-q-flow' }
      ] },
      { id: 'b1-summary', title: 'Summary', blocks: [
        { id: 'b1-summary-l', type: 'list', items: [
          'Copies named “final_v3” hide what changed; <b>version control</b> keeps one set of files and a history of messages, authors and times.',
          'A <b>commit</b> is one saved version; the <b>history</b> is all of them; a <b>repository</b> is the folder with its history.',
          '<b>Git</b> is the tool on your computer and works offline. <b>GitHub</b> is the website that shares and backs up repositories.',
          'School projects live in the school’s <b>organization</b> so they stay when people leave.'
        ] }
      ] }
    ],
    questions: [
      { id: 'b1-q-chaos', type: 'mc', prompt: 'Why is a folder with <code>report_final.docx</code> and <code>report_final2.docx</code> a poor way to track versions?',
        options: ['Word cannot open files with “final” in the name', 'The names do not say what changed, who changed it, or which is newest', 'Copies use too much disk space for Git to handle', 'It is only a problem when working alone'],
        answer: 1, hints: ['Think about what you would want to know a month later.'], explain: 'File names carry no message, author or order. Version control records those for every saved version. Disk space and Word are not the issue, and the problem gets <em>worse</em> with several people.' },
      { id: 'b1-q-vs', type: 'match', prompt: 'Match each description to Git or GitHub.',
        pairs: [['Software that records history on your own computer', 'Git'], ['A website that stores repositories online', 'GitHub'], ['Works without internet', 'Git'], ['Lets you control who may read or change a project online', 'GitHub']],
        explain: 'Git is the tool; GitHub is the online service built around it.' },
      { id: 'b1-q-laptop', type: 'mc', prompt: 'Aino keeps her thesis in a Git repository on her own laptop only. What is true?',
        options: ['It is safely backed up, because Git keeps the history', 'She has a full history, but if the laptop is lost the project is lost too', 'Her supervisor can already see it', 'She cannot go back to older versions without internet'],
        answer: 1, hints: ['Where is the history stored?'], explain: 'Git’s history is local. It is a good record but not a backup, and nobody else can see it until it is shared, for example on GitHub. Going back in time works offline.' },
      { id: 'b1-q-home', type: 'mc', prompt: 'Ben is leaving HAMK. Where should his summer project be so that the school keeps it?',
        options: ['In his personal GitHub account', 'On his laptop, with a backup on a USB stick', 'In the <code>hamk-projects</code> organization', 'In an email to his supervisor'],
        answer: 2, hints: ['Who owns the repository when Ben leaves?'], explain: 'A repository owned by the organization stays when a person leaves. A personal account or laptop leaves with its owner.' },
      { id: 'b1-q-flow', type: 'order', prompt: 'Put a basic working routine in order.',
        items: ['Edit your files', 'Save a snapshot with a message (commit)', 'Send the history to GitHub', 'A teammate reads and reviews the changes'],
        explain: 'Work, record a commit locally, share it online, then others can review. You will practise each step in the next lessons.' }
    ]
  });
})();
