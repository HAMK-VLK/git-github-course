/* i7 = A repository others can use: README, Markdown, licence, citation, template, topics. */
(function () {
  var SLUG = 'hamk-projects/course-web-dev';
  function tree(w, slug) { var r = w.server.repos[slug || SLUG]; return r ? w.commit(r.refs.main).tree : {}; }
  function html(s) { return (s && s.html) || ''; }
  function has(s, re) { return re.test(html(s)); }

  var WORLD = {
    me: 'aino', myName: 'Aino Student', config: { 'user.name': 'Aino Student', 'user.email': 'aino@example.com' },
    users: { teacher: { name: 'Tiina Teacher' } },
    orgs: { 'hamk-projects': { displayName: 'HAMK Projects', owners: ['teacher'], members: ['aino'], settings: { basePermission: 'read' }, teams: {} } },
    remotes: {
      'hamk-projects/course-web-dev': {
        visibility: 'public', collaborators: { aino: 'admin' }, description: '',
        commits: [
          { msg: 'Initial commit', author: 'teacher', files: { 'README.md': '# course-web-dev\n' } },
          { msg: 'Add week 1 slides', author: 'teacher', files: { 'slides/week1.md': '# Week 1\n' } }
        ]
      }
    },
    run: []
  };

  var START = '# Thesis notes\n\nThis is my thesis.\n';
  var README = '# Thesis notes\n\n## What is this?\nMy bachelor thesis about version control.\n\n## Structure\n- `chapters/` text\n\n## Status\nDraft 1\n\n## Contact\nAino\n\n## Licence\nCC BY 4.0\n';

  TDC.registerTopic({
    id: 'i7',
    title: 'A repository others can use',
    subtitle: 'A README, a licence and a few settings turn a folder of files into something a stranger can understand and reuse.',
    audience: 'students, teachers and staff who share work on GitHub',
    objectives: [
      'write a README that answers what, how, structure, status, contact and licence',
      'format text with Markdown: headings, lists, links, bold and code blocks',
      'choose a licence for code (MIT) or documents (CC BY 4.0) and know when to ask the school',
      'add a CITATION.cff file so others can cite your work',
      'set a description and topics, and turn a repository into a template'
    ],
    glossary: {
      readme: { term: 'README', def: 'The front page of a repository: a text file called README.md that GitHub shows below the file list.' },
      markdown: { term: 'Markdown', def: 'A way of writing formatted text in a plain file (for example <code># Title</code> for a heading). Files ending in <code>.md</code> use it.' },
      license: { term: 'licence', def: 'A file (usually <code>LICENSE</code>) that says what others may do with your work: copy it, change it, share it. Without one, the default is "all rights reserved".' },
      topic: { term: 'topic', def: 'A short keyword (such as <code>thesis</code> or <code>course-material</code>) attached to a repository so it can be found and grouped.' },
      template: { term: 'template repository', def: 'A repository marked as a template: others click <b>Use this template</b> to start a new repository with the same files, but without the history.' }
    },
    commands: [],
    sections: [
      { id: 'i7-why', title: 'Why a repository needs a front page', blocks: [
        { id: 'i7-why-t', type: 'text', html: '<p>A repository that is only files is like a binder without a cover. Your thesis supervisor, the next summer-project team or a colleague who inherits the course material opens it and asks: what is this, and what do I do with it? The <dfn data-term="readme">README</dfn> answers that. GitHub shows <code>README.md</code> below the file list, so it is the first thing every visitor reads.</p><p>Think of the person who takes over your project when you leave the school. A good README is the hand-over note you write once and never have to repeat.</p>' },
        { id: 'i7-why-tbl', type: 'table', head: ['Part of the README', 'Question it answers', 'Thesis example'], rows: [
          ['Title and one-line summary', 'What is this?', '<code># Thesis: version control at HAMK</code>'],
          ['How to run / use', 'How do I open, build or read it?', 'Open <code>thesis.pdf</code>, or build with <code>make pdf</code>'],
          ['Structure', 'Where is what?', '<code>chapters/</code> text, <code>figures/</code> images'],
          ['Status', 'Is it finished?', 'Draft 1, submitted in May 2027'],
          ['Contact', 'Who do I ask?', 'Aino Student, supervisor Tiina Teacher'],
          ['Licence', 'What may I do with it?', 'CC BY 4.0']
        ], caption: 'The six things a README should answer.', compact: true },
        { id: 'i7-why-c', type: 'callout', kind: 'tip', title: 'Short beats perfect', html: 'Ten honest lines are better than a long README nobody updates. Write for a reader who knows nothing about your project and has two minutes.' },
        { id: 'i7-q-parts-blk', type: 'question', q: 'i7-q-parts' }
      ] },
      { id: 'i7-md', title: 'Markdown in five minutes', blocks: [
        { id: 'i7-md-t', type: 'text', html: '<p><dfn data-term="markdown">Markdown</dfn> is plain text with a few marks that GitHub turns into formatting. You can write it in any editor, and the browser editor shows a <b>Preview</b>. The marks you need most:</p>' },
        { id: 'i7-md-tbl', type: 'table', head: ['You type', 'You get'], rows: [
          ['<code># Title</code>, <code>## Section</code>', 'Heading (more # = smaller heading)'],
          ['<code>- item</code> or <code>1. item</code>', 'Bullet list or numbered list'],
          ['<code>[HAMK](https://www.hamk.fi)</code>', 'A link with the words in brackets'],
          ['<code>**important**</code>, <code>*note*</code>', 'Bold, italic'],
          ['<code>`git status`</code> (single backticks)', 'Short piece of code inside a sentence'],
          ['three backticks on a line of their own, code, three backticks again', 'A code block'],
          ['<code>![Diagram](figures/flow.png)</code>', 'An image from the repository']
        ], compact: true },
        { id: 'i7-md-c', type: 'callout', kind: 'warn', title: 'Blank lines matter', html: 'A heading or a list needs an empty line before it, and a single line break inside a paragraph does not start a new line. If your text looks glued together, add an empty line.' },
        { id: 'i7-md-sim', type: 'interactive', widget: 'markdown', title: 'Write Markdown and watch the preview',
          caption: 'The preview on the right is a simplified version of what GitHub shows. Edit the text on the left.',
          config: { start: START, tasks: [
            { id: 'h', text: 'Add a <b>heading</b> (a line starting with <code>##</code>)', check: function (s) { return has(s, /<h2>/); }, hint: 'Start a new line with ## and a space.', solution: '## Contents' },
            { id: 'list', text: 'Add a <b>bullet list</b> with at least two items', check: function (s) { return has(s, /<ul>(?:(?!<\/ul>)[\s\S])*<li>[\s\S]*<li>/); }, hint: 'Put an empty line before the list. Start each line with - and a space.', solution: '- chapters/ text\n- figures/ images' },
            { id: 'link', text: 'Add a <b>link</b> like <code>[HAMK](https://www.hamk.fi)</code>', check: function (s) { return has(s, /<a href/); }, hint: 'Words in square brackets, address in round brackets, no space between.', solution: '[HAMK](https://www.hamk.fi)' },
            { id: 'code', text: 'Add a <b>code block</b> between two lines of three backticks', check: function (s) { return has(s, /<pre><code>/); }, hint: 'Each line of three backticks must stand alone on its line.', solution: '```\ngit clone <address>\n```' },
            { id: 'bold', text: 'Make a word <b>bold</b> with <code>**two stars**</code>', check: function (s) { return has(s, /<strong>/); }, solution: '**Draft**' }
          ] } },
        { id: 'i7-q-md-blk', type: 'question', q: 'i7-q-md' }
      ] },
      { id: 'i7-write', title: 'Write a README that does its job', blocks: [
        { id: 'i7-wr-t', type: 'text', html: '<p>Use one heading per question from the table. The same headings in every project of the school make the READMEs easy to scan. Replace the draft in the editor below with a README that has these six sections: <b>What is this?</b>, <b>How to use</b>, <b>Structure</b>, <b>Status</b>, <b>Contact</b> and <b>Licence</b>.</p>' },
        { id: 'i7-wr-code', type: 'code', lang: 'markdown', title: 'README.md (skeleton)', code: '# Thesis: version control at HAMK\n\nBachelor thesis by Aino Student, HAMK 2027.\n\n## How to use\nOpen `thesis.pdf`. To rebuild it, run `make pdf`.\n\n## Structure\n- `chapters/` text of the thesis\n- `figures/` images\n\n## Status\nDraft 1, waiting for feedback.\n\n## Contact\nAino Student, supervisor Tiina Teacher (@teacher)\n\n## Licence\nText: CC BY 4.0. Code: MIT.' },
        { id: 'i7-wr-sim', type: 'interactive', widget: 'markdown', title: 'Write a complete README',
          caption: 'Fill in the six sections. Contact and licence can be short.',
          config: { start: 'This is my thesis.\n', tasks: [
            { id: 'title', text: 'A top-level <b>title</b> (<code># ...</code>)', check: function (s) { return has(s, /<h1>/); }, solution: '# Thesis notes' },
            { id: 'sections', text: 'At least <b>five sections</b> (<code>##</code> headings)', check: function (s) { return (html(s).match(/<h2>/g) || []).length >= 5; }, hint: 'What, how to use, structure, status, contact, licence.', solution: README },
            { id: 'struct', text: 'A <b>Structure</b> section that contains a bullet list', check: function (s) { return /<h2>\s*structure\s*<\/h2>\s*<ul>/i.test(html(s)); }, hint: 'Write ## Structure, an empty line, then lines starting with - .', solution: '## Structure\n- `chapters/` text' },
            { id: 'lic', text: 'A <b>Licence</b> (or <b>License</b>) section', check: function (s) { return /<h2>\s*licen[cs]e\s*<\/h2>/i.test(html(s)); }, solution: '## Licence\nCC BY 4.0' },
            { id: 'contact', text: 'A <b>Contact</b> section', check: function (s) { return /<h2>\s*contact\s*<\/h2>/i.test(html(s)); }, solution: '## Contact\nAino Student' }
          ] } },
        { id: 'i7-wr-c', type: 'callout', kind: 'school', title: 'Never put secrets or personal data in a README', html: 'A README is public to everyone who can see the repository. Do not write passwords, tokens, student numbers or private email addresses in it. Use a school contact address or a GitHub name.' },
        { id: 'i7-q-secret-blk', type: 'question', q: 'i7-q-secret' }
      ] },
      { id: 'i7-licence', title: 'Choosing a licence', blocks: [
        { id: 'i7-li-t', type: 'text', html: '<p>Public does not mean free to use. If a repository has no <dfn data-term="license">licence</dfn>, the law says: all rights reserved. Others may look, but they may not copy, change or share your work. A <code>LICENSE</code> file says what is allowed.</p>' },
        { id: 'i7-li-tbl', type: 'table', head: ['Licence', 'Good for', 'What it asks of others'], rows: [
          ['<b>MIT</b>', 'Code, small tools, examples', 'Keep the copyright notice. Otherwise do almost anything.'],
          ['<b>Apache-2.0</b>', 'Larger code projects', 'Like MIT, plus a patent grant and a notice of changes.'],
          ['<b>GPL-3.0</b>', 'Code that must stay open', 'Anything built on it must be shared under the same licence.'],
          ['<b>CC BY 4.0</b>', 'Documents, slides, course material, data', 'Give credit to the author. Otherwise free to reuse.'],
          ['No licence', 'Private work', 'Nothing is allowed without asking you.']
        ], caption: 'Common choices. Creative Commons licences are made for text and media, not for software.', compact: true },
        { id: 'i7-li-c', type: 'callout', kind: 'school', title: 'Ask the school first', html: 'Work done for HAMK (a thesis for a company, course material, a research project) may belong partly to the school or to a partner. Do not choose a licence on your own for such work: ask your supervisor or the school\'s copyright or IT contact. When in doubt, keep the repository private and without a public licence until you have an answer.' },
        { id: 'i7-li-t2', type: 'text', html: '<p>On github.com you can pick a licence when you create a repository (<b>Add license</b>), or later by adding a file called <code>LICENSE</code>. When you type that name in <b>Add file → Create new file</b>, real GitHub shows a <b>Choose a license template</b> button. The practice site has no such button: add the file by hand there.</p>' },        { id: 'i7-q-lic-blk', type: 'question', q: 'i7-q-lic' }
      ] },
      { id: 'i7-settings', title: 'Citation, description, topics and templates', blocks: [
        { id: 'i7-st-t', type: 'text', html: '<p>Four small things make a repository easier to find and reuse:</p>' },
        { id: 'i7-st-l', type: 'list', items: [
          '<b>CITATION.cff</b>: a small text file in the top folder that tells people how to cite your work. GitHub then shows a <b>Cite this repository</b> link.',          '<b>Description</b>: one line shown in the <b>About</b> box and in search results. Edit it with the gear ⚙ next to <b>About</b> on the repository page.',
          '<dfn data-term="topic">Topics</dfn>: keywords such as <code>thesis</code> or <code>course-material</code>. Edit them with the same gear ⚙ next to <b>About</b>. Topics use lowercase letters, numbers and hyphens (no spaces inside a topic), up to 50 characters each and 20 per repository.',          '<dfn data-term="template">Template repository</dfn>: tick <b>Template repository</b> in <b>Settings → General</b>. Others then get a green <b>Use this template</b> button to start a new repository with the same files. Ideal for a thesis skeleton or a course starter.'
        ] },
        { id: 'i7-st-code', type: 'code', lang: 'yaml', title: 'CITATION.cff', code: 'cff-version: 1.2.0\nmessage: "If you use this material, please cite it as below."\ntitle: "Web development course material"\nauthors:\n  - family-names: Teacher\n    given-names: Tiina\nversion: 1.0.0\ndate-released: 2027-01-15\nlicense: CC-BY-4.0' },
        { id: 'i7-st-sim', type: 'interactive', widget: 'github', title: 'Make course-web-dev reusable',
          caption: 'You are <b>aino</b>, with Admin access to <code>course-web-dev</code>. Use <b>Add file → Create new file</b> for the two files, the gear ⚙ next to <b>About</b> for the description and topics, and <b>Settings → General</b> for the template. Then try the template yourself with <b>Use this template</b>. The practice site does not check what is inside the files.',
          config: {
            start: '/' + SLUG, personas: ['aino'], terminal: false, world: WORLD,
            tasks: [
              { id: 'lic', text: 'Add a file named <code>LICENSE</code> (for example with the text of CC BY 4.0) and commit it', check: function (w) { return tree(w)['LICENSE'] != null; }, hint: 'Add file → Create new file, name it LICENSE, type some text, Commit changes…', solution: 'Add file → Create new file → name LICENSE → text → Commit changes…' },
              { id: 'cff', text: 'Add <code>CITATION.cff</code> and commit it', check: function (w) { return tree(w)['CITATION.cff'] != null; }, solution: 'Add file → Create new file → name CITATION.cff → paste the example → Commit changes…' },
              { id: 'desc', text: 'Set a <b>Description</b> with the gear ⚙ next to <b>About</b>', check: function (w) { return !!w.server.repos[SLUG].description; }, solution: 'Repository page → ⚙ next to About → Description → Save changes' },
              { id: 'topics', text: 'Add at least two <b>topics</b> (separated by spaces)', check: function (w) { return (w.server.repos[SLUG].topics || []).length >= 2; }, hint: 'The gear next to About opens Edit repository details, with a Topics box.', solution: '⚙ next to About → Topics: course-material web → Save changes' },
              { id: 'tpl', text: 'Mark the repository as a <b>template repository</b>', check: function (w) { return !!w.server.repos[SLUG].template; }, solution: 'Settings → General → tick Template repository → Save changes' },
              { id: 'use', text: 'Start a new repository from it with <b>Use this template</b>', check: function (w) { return Object.keys(w.server.repos).some(function (s) { return w.server.repos[s].generatedFrom === SLUG; }); }, hint: 'The green Use this template button appears on the Code tab once the repository is a template.', solution: 'Code tab → Use this template → Repository name: my-course → Create repository' }
            ] } },
        { id: 'i7-q-topics-blk', type: 'question', q: 'i7-q-tpl' }
      ] },
      { id: 'i7-new', title: 'Start right: create a repository with README and licence', blocks: [
        { id: 'i7-new-t', type: 'text', html: '<p>The easiest moment to do this well is the moment you create the repository. The <b>New repository</b> page has a <b>Configuration</b> area: switch on <b>Add README</b> and pick a licence in <b>Add license</b>. GitHub creates both files in the first commit. Add a one-line description while you are there.</p>' },
        { id: 'i7-new-c', type: 'callout', kind: 'info', title: 'Where the repository lives', html: 'Projects for the school belong in the <b>hamk-projects</b> organization so they stay when you leave. In the practice site, <b>aino</b> creates the repository under her own account to keep things simple.' },
        { id: 'i7-new-sim', type: 'interactive', widget: 'github', title: 'Create a repository with a README and a licence',
          caption: 'Open <b>+ → New repository</b>, or use the page that is already open.',
          config: {
            start: '/new', personas: ['aino'], terminal: false, world: WORLD,
            tasks: [
              { id: 'new', text: 'Create a repository with a <b>README</b> and a <b>licence</b> (for example CC-BY-4.0)', check: function (w) {
                return Object.keys(w.server.repos).some(function (s) { if (s === SLUG) return false; var t = tree(w, s); return t['README.md'] != null && t['LICENSE'] != null; });
              }, hint: 'Give it a name, switch on Add README, pick a licence in Add license, click Create repository.', solution: 'Name: thesis-notes → Add README: on → Add license: CC-BY-4.0 → Create repository' }
            ] } },
        { id: 'i7-q-new-blk', type: 'question', q: 'i7-q-new' }
      ] },
      { id: 'i7-summary', title: 'Summary', blocks: [
        { id: 'i7-sum', type: 'list', items: [
          'A README answers: what is it, how to use it, structure, status, contact, licence.',
          'Markdown: <code>#</code> headings, <code>-</code> lists, <code>[text](address)</code> links, <code>**bold**</code>, backticks for code.',
          'No licence means all rights reserved. Use MIT for code and CC BY 4.0 for documents, and ask the school first for school work.',
          '<code>CITATION.cff</code> tells people how to cite you. Add a description and topics so the repository can be found.',
          'Tick <b>Template repository</b> for starter material. Create new repositories with a README and licence from the start.'
        ] }
      ] }
    ],
    questions: [
      { id: 'i7-q-parts', type: 'multi', prompt: 'Which of these belong in a good README?',
        options: ['What the project is', 'How to use or open it', 'Who to contact', 'Your password for the shared drive'], answer: [0, 1, 2], hints: ['A README is public to everyone who can see the repository.'],
        explain: 'Answer what, how, structure, status, contact and licence. Never write secrets in it.' },
      { id: 'i7-q-md', type: 'fill', prompt: 'Which characters at the start of a line make a second-level heading in Markdown?', text: '[[a]] Methods', answer: { a: ['##'] },
        explain: 'One <code>#</code> is the title, <code>##</code> a section, <code>###</code> a sub-section.' },
      { id: 'i7-q-secret', type: 'mc', prompt: 'A contact line in a public README should be...', options: ['your private phone number', 'a school email address or your GitHub name', 'your student number'], answer: 1, shuffle: false,
        explain: 'Use a contact that can be public and that will still work later. Do not publish private data.' },
      { id: 'i7-q-lic', type: 'match', prompt: 'Match the work to the usual licence.',
        pairs: [['A small Python script', 'MIT'], ['Course slides and handouts', 'CC BY 4.0'], ['A repository with no LICENSE file', 'All rights reserved']],
        explain: 'MIT suits code, CC BY 4.0 suits documents. Without a licence others may not reuse the work.' },
      { id: 'i7-q-tpl', type: 'mc', prompt: 'You want colleagues to start new courses from your folder structure. What do you do?',
        options: ['Mark the repository as a template repository', 'Email them a ZIP file', 'Make everyone an admin'], answer: 0, shuffle: false,
        explain: 'A template repository gives everyone a <b>Use this template</b> button; each copy starts fresh without your history.' },
      { id: 'i7-q-new', type: 'order', prompt: 'Put the steps of creating a well-prepared repository in order.',
        items: ['Open the New repository page', 'Type the repository name', 'Switch on Add README and pick a licence', 'Click Create repository'],
        explain: 'README and licence are chosen on the same page, before you click Create.' }
    ]
  });
})();
