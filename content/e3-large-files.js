/* e3 = Large files and research data. Terminal simulator for .gitignore + README; Git LFS is explained only. */
TDC.registerTopic({
  id: 'e3',
  title: 'Large files and research data',
  subtitle: 'Keep big files and personal data out of your repository, and know what to do when they slip in.',
  audience: 'everyone who works with data · after the basics',
  objectives: [
    'explain why large binary files make a repository grow for good',
    'name the GitHub file and repository size limits',
    'explain what Git LFS does and when it helps',
    'keep data out of Git with .gitignore and a README link to research storage',
    'explain why personal data never belongs in a repository and what removing a committed file takes'
  ],
  glossary: {
    gitignore: { term: '.gitignore', def: 'A text file in your repository that lists files and folders Git should not track, for example data/ or *.zip.' },
    lfs: { term: 'Git LFS', def: 'Git Large File Storage. An add-on that keeps large files on a separate server and stores only small pointer files in the repository.' }
  },
  commands: [
    { cmd: 'echo "data/" >> .gitignore', does: 'Add a line to .gitignore so the data folder is not tracked' },
    { cmd: 'git status', does: 'Check that ignored files no longer show up as untracked' },
    { cmd: 'git lfs track "*.psd"', does: 'Tell Git LFS to handle all .psd files (writes .gitattributes)' },
    { cmd: 'git filter-repo --path <file> --invert-paths', does: 'Remove a file from the whole history (rewrites history, a separate tool)' }
  ],
  sections: [
    { id: 'e3-why', title: 'Why big files are a problem', blocks: [
      { id: 'e3-t1', type: 'text', html: '<p>Git is built for text: code, notes, small tables. It keeps <b>every version of every file</b> forever, so the history is a copy of everything you ever committed. A 40 MB video that you change five times adds about 200 MB. Deleting the file later does not help, because the old versions stay in the history.</p>' },
      { id: 'e3-t2', type: 'text', html: '<p>Everyone who clones the repository downloads all of it. A repository that is a few gigabytes is slow to clone, slow to back up and hard to share.</p>' },
      { id: 'e3-c1', type: 'callout', kind: 'key', title: 'Key idea', html: 'Committing a file is almost permanent. Think before you add data, videos, installers or archives, because removing them afterwards is hard.' },
      { id: 'e3-q1', type: 'question', q: 'e3-q-history' }
    ] },
    { id: 'e3-limits', title: 'GitHub size limits', blocks: [
      { id: 'e3-t3', type: 'text', html: '<p>GitHub sets limits so repositories stay usable. These are the numbers to remember:</p>' },
      { id: 'e3-tbl', type: 'table', head: ['What', 'Limit'],
        rows: [['A file larger than 50 MB', 'Git shows a warning when you push, but the push works'],
               ['A file larger than 100 MB', 'GitHub blocks the push'],               ['A whole repository', 'Recommended to stay under 1 GB, strongly under 5 GB']] },      { id: 'e3-t4', type: 'text', html: '<p>Files uploaded through the browser have an even smaller limit (25 MB per file).</p>' },      { id: 'e3-w1', type: 'callout', kind: 'warn', title: 'Common mistake', html: 'The push is blocked at the <em>end</em>, after the file is already in your local history. Deleting the file in a new commit does not fix it: the big version is still in an older commit, and the push is still refused.' },
      { id: 'e3-q2', type: 'question', q: 'e3-q-limit' }
    ] },
    { id: 'e3-lfs', title: 'Git LFS: big files that must be versioned', blocks: [
      { id: 'e3-t5', type: 'text', html: '<p><dfn data-term="lfs">Git LFS</dfn> (Large File Storage) is an add-on for files that really need versions, such as design files or a few large models. The repository keeps only a tiny <em>pointer</em> text file. The real content lives on a separate LFS server and is downloaded when you check out that version.</p>' },
      { id: 'e3-code1', type: 'code', lang: 'bash', code: '$ git lfs install\n$ git lfs track "*.psd"\nTracking "*.psd"\n$ git add .gitattributes\n$ git add logo.psd\n$ git commit -m "Add logo design"' },
      { id: 'e3-t6', type: 'text', html: '<p><code>git lfs track</code> writes a rule into a file called <code>.gitattributes</code>. Commit that file, so everyone follows the same rule. Track the pattern <em>before</em> you add the big files.</p>' },
      { id: 'e3-c2', type: 'callout', kind: 'info', title: 'Not simulated here', html: 'Git LFS needs a separate program and an LFS server, so this course only explains it. Check your quota first: GitHub gives a small free storage and bandwidth allowance for LFS (about 10 GiB on the free plan), and more costs money.' },      { id: 'e3-c3', type: 'callout', kind: 'school', title: 'At HAMK', html: 'For research data LFS is usually the wrong tool. Use the school research storage (next section) and keep Git for code, text and small files.' },
      { id: 'e3-q3', type: 'question', q: 'e3-q-lfs' }
    ] },
    { id: 'e3-data', title: 'Research data stays in research storage', blocks: [
      { id: 'e3-t7', type: 'text', html: '<p>Datasets, interview recordings and survey exports belong in the school research storage, not on GitHub. The repository only needs three things: your code, a <dfn data-term="gitignore">.gitignore</dfn> that keeps the data out, and a <b>README</b> that tells readers where the data lives and how to ask for access.</p>' },
      { id: 'e3-code2', type: 'code', lang: 'text', title: '.gitignore', code: '# Research data lives in the school storage\ndata/\n*.zip' },
      { id: 'e3-code3', type: 'code', lang: 'markdown', title: 'README.md', code: '## Data\n\nThe data is not in this repository.\nIt is stored in the HAMK research storage: https://research-storage.hamk.example\nAsk your supervisor for access.' },
      { id: 'e3-c4', type: 'callout', kind: 'warn', title: 'Personal data (GDPR)', html: '<b>Never put personal data in a repository.</b> This includes names, e-mail addresses, student numbers, photos, recordings and survey answers that can identify a person. A repository, even a private one, is shared with others and copied to many computers, and history cannot be fully erased. Check the school’s data management rules, and ask your supervisor or data protection contact before you share anything about real people.' },
      { id: 'e3-c5', type: 'callout', kind: 'tip', title: 'Ignore early', html: '<code>.gitignore</code> only affects files Git does not track yet. If a file is already committed, adding it to <code>.gitignore</code> will not remove it.' },
      { id: 'e3-term1', type: 'interactive', widget: 'terminal', title: 'Keep data out and link to the research storage',
        caption: 'The thesis folder has a data folder and a zip file that must never be committed. Run git status to see them listed as untracked.',
        config: {
          world: { config: { 'user.name': 'Aino Student', 'user.email': 'aino@example.com', 'init.defaultBranch': 'main' }, cwd: '~/thesis',
            files: { '~/thesis/README.md': '# Thesis\n', '~/thesis/thesis.md': 'Draft.\n', '~/thesis/data/survey-raw.csv': 'id,answer\n1,yes\n2,no\n', '~/thesis/results.zip': 'PK-fake-archive' },
            run: ['git init', 'git add README.md thesis.md', 'git commit -m "Start thesis"'] },
          panels: ['areas'],
          tasks: [
            { id: 'ignore', text: 'Create a <code>.gitignore</code> that ignores the <code>data/</code> folder and <code>*.zip</code> files. Try: <code>echo "data/\\n*.zip" &gt; .gitignore</code>', check: function (w) { var r = w.repo(); if (!r) return false; var s = w.status(r); return s.ignored.length >= 2 && !s.untracked.some(function (u) { return /^data\/|\.zip$/.test(u.p); }); }, hint: 'Use <code>git status</code> afterwards: the data files should no longer be listed as untracked.', solution: 'echo "data/\\n*.zip" > .gitignore' },
            { id: 'readme', text: 'Add a <b>Data</b> section to the README that links to the research storage: <code>echo "## Data\\nSee https://research-storage.hamk.example" &gt;&gt; README.md</code>', check: function (w) { var f = w.readFile('~/thesis/README.md') || ''; return /## Data/.test(f) && /https?:\/\//.test(f); }, hint: 'Use <code>&gt;&gt;</code> to append, so the first line stays.', solution: 'echo "## Data\\nSee https://research-storage.hamk.example" >> README.md' },
            { id: 'commit', text: 'Commit both files, but not the data: <code>git add .gitignore README.md</code> and <code>git commit -m "Ignore data, link research storage"</code>', check: function (w) { var r = w.repo(); if (!r) return false; var t = w.headTree(r), ks = Object.keys(t); return /data\//.test(t['.gitignore'] || '') && /\*\.zip/.test(t['.gitignore'] || '') && /https?:\/\//.test(t['README.md'] || '') && !ks.some(function (k) { return /^data\/|\.zip$/.test(k); }); }, hint: 'Add the two files by name. Check with <code>git status</code> that nothing from data/ is staged.', solution: 'git add .gitignore README.md\ngit commit -m "Ignore data, link research storage"' }
          ]
        } },
      { id: 'e3-q4', type: 'question', q: 'e3-q-gdpr' }
    ] },
    { id: 'e3-oops', title: 'When a big file is already committed', blocks: [
      { id: 'e3-t8', type: 'text', html: '<p>Deleting the file in a new commit, or adding it to <code>.gitignore</code>, leaves it in the history. To really remove it you must <b>rewrite the history</b>. The usual tool is <code>git filter-repo</code>, a separate program.</p>' },      { id: 'e3-code4', type: 'code', lang: 'bash', code: '$ git filter-repo --path data/survey-raw.csv --invert-paths\n$ git remote add origin <url-of-the-repository>\n$ git push --force origin main' },
      { id: 'e3-t8b', type: 'text', html: '<p>The extra <code>git remote add</code> line is needed because <code>git filter-repo</code> removes the <code>origin</code> remote on purpose, as a safety stop before you overwrite the server copy.</p>' },
      { id: 'e3-w2', type: 'callout', kind: 'warn', title: 'Before you rewrite history', html: 'Rewriting changes every commit id after the file first appeared, so everyone with a copy must re-clone. If the file held personal data or a password, treat it as <b>already leaked</b>: tell your supervisor, because other copies (clones, forks) may still exist. Prevention is far cheaper than this repair.' },
      { id: 'e3-q5', type: 'question', q: 'e3-q-remove' }
    ] },
    { id: 'e3-summary', title: 'Summary', blocks: [
      { id: 'e3-sum', type: 'list', items: [
        'Git keeps every version of every file, so big binaries make the repository grow for good.',
        'GitHub warns at 50 MB and blocks files over 100 MB; keep a repository well under a few GB.',
        '<b>Git LFS</b> stores big files elsewhere and keeps pointers in the repository (<code>git lfs track</code>, <code>.gitattributes</code>).',
        'Datasets go in the school research storage. Use <code>.gitignore</code> and link to it from the README.',
        '<b>Never</b> commit personal data. Removing a committed file needs a history rewrite (<code>git filter-repo</code>).'
      ] }
    ] }
  ],
  questions: [
    { id: 'e3-q-history', type: 'mc', prompt: 'You committed a 60 MB video, then deleted it in the next commit. How big is the repository now?',
      options: ['Back to normal, the file is gone', 'Still about 60 MB larger, because the old commit keeps the video', 'Smaller than before'],
      answer: 1, hints: ['What does a commit store?'], explain: 'Every commit is a permanent snapshot. A later commit that deletes the file only changes the latest snapshot.' },
    { id: 'e3-q-limit', type: 'match', prompt: 'Match the file size to what GitHub does.',
      pairs: [['30 MB', 'Pushes without a problem'], ['70 MB', 'Pushes, with a warning'], ['150 MB', 'Push is blocked']], explain: 'Over 50 MB you get a warning; over 100 MB the push is blocked.' },    { id: 'e3-q-lfs', type: 'fill', prompt: 'Complete the command that makes Git LFS handle all PSD files.', text: 'git lfs [[a]] "*.psd"',
      answer: { a: ['track'] }, hints: ['It tells LFS which files to follow.'], explain: '<code>git lfs track</code> adds the pattern to <code>.gitattributes</code>.' },
    { id: 'e3-q-gdpr', type: 'multi', prompt: 'Which of these may you commit to a thesis repository?',
      options: ['The analysis script', 'A CSV with participants’ names and e-mails', 'A README that links to the research storage', 'Recorded interviews'],
      answer: [0, 2], explain: 'Code and a README link are fine. Anything that identifies people, and large recordings, stay in the research storage.' },
    { id: 'e3-q-remove', type: 'mc', prompt: 'A 200 MB file is already in your history and the push is blocked. What fixes it?',
      options: ['Delete the file and commit', 'Add the file to .gitignore', 'Rewrite the history to remove it, for example with git filter-repo'],
      answer: 2, hints: ['The file is in an old commit.'], explain: 'Only a history rewrite removes the file from old commits. A new commit or .gitignore leaves the old copy in place.' },
    { id: 'e3-q-order', type: 'order', prompt: 'Put the steps for protecting research data in the order used in this lesson.',
      items: ['Store the data in the school research storage', 'Add data/ to .gitignore', 'Add a README section that links to the storage', 'Commit .gitignore and README'], explain: 'Data goes to its proper home first, then Git is told to ignore it, then the README points to it, and only then do you commit.' }
  ]
});
