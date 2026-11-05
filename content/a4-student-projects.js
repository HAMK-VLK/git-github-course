/* a4 = 3.4 Submitting student projects to the school (both tracks). Four simulators:
 * 1 github (teacher): repository from template + Write for the student; 2 terminal (student): work, tag, push;
 * 3 github (student): transfer a personal repo into the org; 4 github + terminal: archive, then a push is refused.
 * Simulator notes: "Use this template" on the template's page, or "Choose a template" on the New repository page; tags are pushed from the terminal here. */
(function () {
  var ORG = 'hamk-projects';
  var CFG = { 'user.name': 'Aino Student', 'user.email': 'aino@example.com', 'init.defaultBranch': 'main' };
  var USERS = { teacher: { name: 'Tiina Teacher' }, aino: { name: 'Aino Student' } };
  function org() { // base permission none: a thesis is private to its owners
    return { displayName: 'HAMK Projects', owners: ['teacher'], members: ['aino'], settings: { basePermission: 'none' } };
  }
  var TEMPLATE = { visibility: 'private', template: true, description: 'Thesis template: chapters, figures, README',
    commits: [{ msg: 'Thesis template', author: 'teacher', files: {
      'README.md': '# Thesis title\n\nAuthor:\nSupervisor:\n\n## Structure\n- `chapters/` text\n- `figures/` images\n',
      'chapters/01-introduction.md': '# Introduction\n', '.gitignore': '*.aux\n*.log\n' } }] };
  var STUDENT_REPO = { visibility: 'private', description: 'Bachelor thesis 2026', collaborators: { aino: 'write' },
    commits: [{ msg: 'Initial commit', author: 'teacher', files: { 'README.md': '# Thesis: Aino Student\n', 'chapters/01-introduction.md': '# Introduction\n' } }] };
  var SLUG = ORG + '/thesis-2026-virtanen';
  var URL = 'https://github.com/' + SLUG + '.git';

  function slugs(w, re) { return Object.keys(w.server.repos).filter(function (s) { return re.test(s); }); }

  TDC.registerTopic({
    id: 'a4',
    title: 'Submitting student projects to the school',
    subtitle: 'The HAMK way: the school owns the repository, the student works in it, and nothing leaves when people do.',
    audience: 'students, supervisors and teachers · after Protecting the main branch',
    objectives: [
      'describe the HAMK project workflow and who does each step',
      'create a repository from a template in hamk-projects and give a student Write access (never Admin)',
      'work, push regularly and mark the submission with the tag v1.0-submitted',
      'list what a student may and may not do in a school repository',
      'archive a repository after graduation and decide what happens to the student\'s access',
      'transfer a personal repository into the organization'
    ],
    glossary: {
      templaterepo: { term: 'template repository', def: 'A repository marked as a template. Anyone who can see it can create a new repository with the same files, without copying its history.' },
      archiving: { term: 'archived repository', def: 'A repository switched to read-only. People can still view and clone it, but nobody can push, open issues or comment until an admin unarchives it.' },
      transferrepo: { term: 'transfer', def: 'Move a repository to a new owner, for example from a personal account into an organization. Issues, history and access links move with it.' }
    },
    commands: [
      { cmd: 'git tag v1.0-submitted', does: 'Mark the submitted version of the project' },
      { cmd: 'git push origin v1.0-submitted', does: 'Send one tag to GitHub (a normal push does not send tags)' },
      { cmd: 'git push --tags', does: 'Send all your local tags to GitHub' }
    ],
    sections: [
      { id: 'a4-flow', title: 'The HAMK project workflow', blocks: [
        { id: 'a4-t1', type: 'text', html: '<p>A thesis or summer project on a private laptop disappears when the student graduates or the laptop breaks. At HAMK every such project lives in the school\'s GitHub organization, <b>hamk-projects</b>. The school keeps the repository for good; the student gets the access needed to work.</p>' },
        { id: 'a4-tbl', type: 'table', caption: 'Who does what, from start to archive.', head: ['Step', 'Who', 'What happens'], rows: [
          ['1. Create', 'Supervisor or IT', 'New repository <b>from the template</b>, owner <code>hamk-projects</code>, <b>private</b>, named <code>thesis-2026-&lt;lastname&gt;</code>'],
          ['2. Give access', 'Supervisor', 'Student gets <b>Write</b> (directly or through a team). The supervisor stays <b>Admin</b>'],
          ['3. Work', 'Student', 'Clone, commit, push regularly. Questions and feedback go in issues and pull requests'],
          ['4. Submit', 'Student', 'Tag <code>v1.0-submitted</code>, push the tag, optionally publish a release'],
          ['5. Close', 'Supervisor', '<b>Archive</b> the repository (read-only). Remove the student or turn them into an outside collaborator']
        ] },
        { id: 'a4-c1', type: 'callout', kind: 'school', title: 'Why Write and not Admin?', html: 'Admin can delete the repository, change who has access, and make it public. If the student had that, the school could lose the project. <b>Write</b> is enough to do everything the work needs. Remember that the organization owner is Admin everywhere, and members cannot delete or transfer repositories unless an owner turns that setting on.' },
        { id: 'a4-q1b', type: 'question', q: 'a4-q-role' }
      ] },
      { id: 'a4-create', title: 'Create the repository from the template', blocks: [
        { id: 'a4-t2', type: 'text', html: '<p>A <dfn data-term="templaterepo">template repository</dfn> holds the starting files every thesis needs: a README, chapter folders, a <code>.gitignore</code>. Creating from the template gives the new repository those files as its first commit, and none of the template\'s history.</p><p>Use a name the school can search: <code>thesis-2026-&lt;lastname&gt;</code>. Keep it <b>private</b> while the work is in progress.</p>' },
        { id: 'a4-gh1', type: 'interactive', widget: 'github', title: 'Create a thesis repository and give the student Write access',
          caption: 'You are the supervisor (<b>teacher</b>). Press <b>Use this template</b> on the template (it is already open), then open the new repository\'s <b>Settings → Collaborators and teams</b>.',
          config: { start: '/hamk-projects/thesis-template', personas: ['teacher', 'aino'],
            world: { me: 'teacher', myName: 'Tiina Teacher', users: USERS, orgs: (function () { var o = {}; o[ORG] = org(); return o; })(),
              remotes: (function () { var r = {}; r[ORG + '/thesis-template'] = TEMPLATE; return r; })() },
            tasks: [
              { id: 'create', text: 'Create <code>hamk-projects/thesis-2026-virtanen</code> (any name starting <code>thesis-2026-</code>) <b>from the template</b>, <b>private</b>',
                hint: 'Open the template and press Use this template (or + menu → New repository → Choose a template). Then owner hamk-projects and the name.',
                solution: 'Use this template (or + menu → New repository → Choose a template: hamk-projects/thesis-template); Owner hamk-projects; name thesis-2026-virtanen; Private → Create repository',
                check: function (w) { return slugs(w, /^hamk-projects\/thesis-2026-[\w-]+$/).some(function (s) { var r = w.server.repos[s]; return r.visibility === 'private' && !!(w.commit(r.refs[r.defaultBranch]) || { tree: {} }).tree['chapters/01-introduction.md']; }); } },
              { id: 'write', text: 'Give <b>aino</b> the <b>Write</b> role on that repository',
                hint: 'Open the repository, then Settings → Collaborators and teams → Add people.',
                solution: 'Repository → Settings → Collaborators and teams → Add people → aino → role Write',
                check: function (w) { return slugs(w, /^hamk-projects\/thesis-2026-/).some(function (s) { return w.roleOf('aino', s) === 'write'; }); } }
            ] } },
        { id: 'a4-c2', type: 'callout', kind: 'tip', title: 'Team or direct access?', html: 'For one student and one repository, adding the person directly is simplest. For a whole class, put the students in a team (for example <b>Thesis 2026</b>) and give the <em>team</em> Write on each repository. Then one change to the team updates every repository.' },
        { id: 'a4-c2b', type: 'callout', kind: 'info', title: 'In this course simulator', html: 'Open the template and press the green <b>Use this template</b> button. The <b>New repository</b> page also has a <b>Choose a template</b> drop-down that does the same.' },        { id: 'a4-q2b', type: 'question', q: 'a4-q-team' }
      ] },
      { id: 'a4-work', title: 'Work, push regularly, submit', blocks: [
        { id: 'a4-t3', type: 'text', html: '<p>The student clones the repository once, then repeats the cycle from the beginner lessons: edit, <code>git add</code>, <code>git commit</code>, <code>git push</code>. <b>Push at least at the end of every working session.</b> A commit that was never pushed is still only on the laptop, so the school cannot see it.</p><p>When the work is ready to hand in, mark that exact moment with a <b>tag</b>: a permanent, named label on one commit. The school name is <code>v1.0-submitted</code>. Later commits do not move it, so the supervisor can always find what was handed in.</p>' },
        { id: 'a4-tabs', type: 'tabs', group: 'tool', tabs: [
          { label: 'Terminal', blocks: [
            { id: 'a4-code1', type: 'code', lang: 'bash', code: '$ git tag v1.0-submitted\n$ git push origin v1.0-submitted\n * [new tag]         v1.0-submitted -> v1.0-submitted' }] },
          { label: 'GitHub Desktop', blocks: [
            { id: 'a4-t3d', type: 'text', html: '<p>Commit and press <b>Push origin</b> as usual. GitHub Desktop cannot create a plain tag: right-click a commit in the <b>History</b> tab and choose <b>Create Tag…</b>, then push (Desktop pushes new tags with the next push).</p>' }] },          { label: 'GitHub website', blocks: [
            { id: 'a4-t3w', type: 'text', html: '<p>On the repository page open <b>Releases → Draft a new release</b>, type <code>v1.0-submitted</code> in <b>Choose a tag</b> and create the tag from the target branch, then publish. A release also lets you attach the PDF of the thesis. The tag is created on GitHub, so nothing needs pushing.</p>' }] }
        ] },
        { id: 'a4-term1', type: 'interactive', widget: 'terminal', title: 'Add a chapter, push it and tag the submission',
          caption: 'You are <b>aino</b>. Clone the repository, add a chapter file, commit, push, then tag the submission and push the tag.',
          config: { panels: ['remote'],
            world: { me: 'aino', myName: 'Aino Student', config: CFG, users: USERS, cwd: '~',
              orgs: (function () { var o = {}; o[ORG] = org(); return o; })(),
              remotes: (function () { var r = {}; r[SLUG] = STUDENT_REPO; return r; })() },
            tasks: [
              { id: 'clone', text: 'Clone <code>' + URL + '</code>', hint: 'git clone <url>',
                solution: 'git clone ' + URL, check: function (w) { return !!w.repo('~/thesis-2026-virtanen'); } },
              { id: 'push', text: 'Add <code>chapters/02-methods.md</code>, commit it and push to <code>main</code>',
                hint: 'cd into the folder, create the file with echo "# Methods" > chapters/02-methods.md, then add, commit, push.',
                solution: 'cd thesis-2026-virtanen\necho "# Methods" > chapters/02-methods.md\ngit add .\ngit commit -m "Add methods chapter"\ngit push',
                check: function (w) { var r = w.server.repos[SLUG]; return !!r && !!(w.commit(r.refs.main) || { tree: {} }).tree['chapters/02-methods.md']; } },
              { id: 'tag', text: 'Create the tag <code>v1.0-submitted</code> and push it to GitHub',
                hint: 'git tag <name>, then git push origin <name>.',
                solution: 'git tag v1.0-submitted\ngit push origin v1.0-submitted',
                check: function (w) { var r = w.server.repos[SLUG]; return !!r && !!r.tags['v1.0-submitted']; } }
            ] } },
        { id: 'a4-c3', type: 'callout', kind: 'warn', title: 'A normal push does not send tags', html: '<code>git push</code> sends commits only. A tag stays on your computer until you run <code>git push origin &lt;tag&gt;</code> or <code>git push --tags</code>. If the supervisor cannot see <code>v1.0-submitted</code> on GitHub, this is almost always the reason.' },
        { id: 'a4-q3b', type: 'question', q: 'a4-q-order' },
        { id: 'a4-q3c', type: 'question', q: 'a4-q-tag' }
      ] },
      { id: 'a4-rules', title: 'What a student may and may not do', blocks: [
        { id: 'a4-t4', type: 'text', html: '<p>With the Write role a student can do the daily work. The things that could lose or leak the project need Admin, and the school keeps those for the supervisor.</p>' },
        { id: 'a4-tbl2', type: 'table', caption: 'Student with Write on a private school repository.', head: ['Action', 'Allowed?'], rows: [
          ['Clone, pull and push to branches', '<b>Yes</b> (to <code>main</code> only if no ruleset blocks it)'],
          ['Create branches and open pull requests', '<b>Yes</b>'],
          ['Open and comment on issues', '<b>Yes</b>'],
          ['Create tags and releases', '<b>Yes</b>'],
          ['Change repository settings, rename it', 'No (Admin)'],
          ['Add or remove people, change access', 'No (Admin)'],
          ['Make the repository public', 'No (Admin, and only an owner unless the organization allows members)'],
          ['Delete or transfer the repository', 'No (Admin <b>and</b> an organization owner, unless the owners allowed members)']
        ] },
        { id: 'a4-q4b', type: 'question', q: 'a4-q-may' }
      ] },
      { id: 'a4-after', title: 'After graduation: archive and clean up access', blocks: [
        { id: 'a4-t5', type: 'text', html: '<p>When the project is accepted, the supervisor <b>archives</b> the repository. An <dfn data-term="archiving">archived repository</dfn> is read-only: it can still be viewed and cloned, but nobody can push, open issues or comment. This freezes the submitted version for good.</p><p>Then decide about the student\'s access:</p><ul><li><b>Remove the student</b> from the organization if they have no more reason to be in it. They lose access to private repositories.</li><li>Or <b>convert them to an outside collaborator</b> if they should keep reading this one repository. They are no longer a member of the organization but keep the direct access they were given.</li></ul><p>Archiving is not deleting, and it can be undone: an Admin can unarchive the repository in <b>Settings → Danger Zone</b>.</p>' },
        { id: 'a4-gh4', type: 'interactive', widget: 'github', title: 'Archive the thesis, then see a push refused',
          caption: 'Aino has a commit she has not pushed yet. As <b>teacher</b>, archive the repository in <b>Settings → Danger Zone</b>. Then press <b>aino</b> in "Practise as", open the <b>Git Bash</b> and run <code>git push</code>.',
          config: { start: '/' + SLUG + '/settings', personas: ['teacher', 'aino'], terminal: true,
            world: { me: 'aino', myName: 'Aino Student', config: CFG, users: USERS, cwd: '~/thesis-2026-virtanen',
              orgs: (function () { var o = {}; o[ORG] = org(); return o; })(),
              remotes: (function () { var r = {}; r[SLUG] = STUDENT_REPO; return r; })(),
              run: ['cd ~', 'git clone ' + URL, 'cd thesis-2026-virtanen', 'echo "# Results" > chapters/03-results.md', 'git add .', 'git commit -m "Add results chapter"'] },
            tasks: [
              { id: 'archive', text: 'As <b>teacher</b>, archive the repository',
                hint: 'Practise as teacher → Settings → scroll to Danger Zone.',
                solution: 'Practise as teacher → Settings → Danger Zone → Archive this repository → confirm',
                check: function (w) { return !!w.server.repos[SLUG].archived; } },
              { id: 'refused', text: 'As <b>aino</b>, run <code>git push</code> and read the error',
                hint: 'Switch the persona to aino, open Git Bash, run git push.',
                solution: 'git push',
                check: function (w) { return !!w.server.repos[SLUG].archived && w.log.some(function (l) { return /^git push/.test(l.cmd) && l.code; }); } }
            ] } },
        { id: 'a4-code2', type: 'code', lang: 'text', title: 'What a student sees after archiving', code: 'remote: This repository was archived so it is read-only.\nfatal: unable to access \'https://github.com/hamk-projects/thesis-2026-virtanen.git\': The requested URL returned error: 403' },        { id: 'a4-c4', type: 'callout', kind: 'tip', title: 'Archived is not hidden', html: 'The student can still <b>clone</b> an archived repository they have access to, so they can keep a personal copy of their own thesis. If the repository must also disappear for them, remove their access.' },
        { id: 'a4-q5b', type: 'question', q: 'a4-q-archive' }
      ] },
      { id: 'a4-transfer', title: 'Move a personal repository into the organization', blocks: [
        { id: 'a4-t6', type: 'text', html: '<p>Sometimes the work started before the school repository existed: a student has been writing the thesis in <code>aino/thesis-draft</code> on her personal account. Do not copy files by hand. <dfn data-term="transferrepo">Transfer</dfn> the repository instead: its history, issues and links move to <b>hamk-projects</b>, and the old web address redirects to the new one.</p><p>Two things must be true: you are <b>Admin</b> of the repository (you own it), and you are allowed to <b>create repositories in the target organization</b>. If the organization does not allow members to create repositories, ask an owner.</p>' },
        { id: 'a4-gh3', type: 'interactive', widget: 'github', title: 'Transfer a personal repository to hamk-projects',
          caption: 'You are <b>aino</b> and own <code>aino/thesis-draft</code>. Open its <b>Settings</b>, scroll to the <b>Danger Zone</b> and use <b>Transfer</b>.',
          config: { start: '/aino/thesis-draft/settings', personas: ['aino'],
            world: { me: 'aino', myName: 'Aino Student', users: USERS, orgs: (function () { var o = {}; o[ORG] = org(); return o; })(),
              remotes: { 'aino/thesis-draft': { visibility: 'private', description: 'My thesis draft',
                commits: [{ msg: 'First draft', author: 'aino', files: { 'README.md': '# Thesis draft\n', 'chapters/01-introduction.md': '# Introduction\n' } }] } } },
            tasks: [
              { id: 'transfer', text: 'Transfer <code>thesis-draft</code> to <b>hamk-projects</b>',
                hint: 'Settings → Danger Zone → Transfer → choose hamk-projects.',
                solution: 'Settings → Danger Zone → Transfer → New owner: hamk-projects → confirm',
                check: function (w) { return !!w.server.repos['hamk-projects/thesis-draft'] && !w.server.repos['aino/thesis-draft']; } }
            ] } },
        { id: 'a4-c5', type: 'callout', kind: 'warn', title: 'After the transfer, check the access', html: 'The people and teams of the <em>organization</em> now decide who sees the repository (base permission, teams). The supervisor should open <b>Settings → Collaborators and teams</b>, give the student Write, rename the repository to the school pattern and set it to private if needed. GitHub adds the former owner as a collaborator on the transferred repository, but do not rely on it: check what access the student really has.' },
        { id: 'a4-q6b', type: 'question', q: 'a4-q-transfer' }
      ] },
      { id: 'a4-summary', title: 'Summary', blocks: [
        { id: 'a4-sum', type: 'list', items: [
          'The school owns the repository: create it in <b>hamk-projects</b> from the template, private, named <code>thesis-2026-&lt;lastname&gt;</code>.',
          'The student gets <b>Write</b>, the supervisor <b>Admin</b>. Deleting, transferring, changing visibility and access need Admin.',
          'Push at the end of every session. Submit with the tag <code>v1.0-submitted</code> and <code>git push origin v1.0-submitted</code>.',
          'After graduation <b>archive</b> the repository (read-only) and remove the student or make them an outside collaborator.',
          'A personal repository can be <b>transferred</b> into the organization by someone who is Admin of it and may create repositories there.'
        ] }
      ] }
    ],
    questions: [
      { id: 'a4-q-role', type: 'mc', prompt: 'Aino is writing her thesis in a school repository. Which role should she get?',
        options: ['Read', 'Write', 'Admin', 'Owner of the organization'], answer: 1, shuffle: false,
        hints: ['She must push, but must not be able to delete or share the project.'],
        explain: '<b>Write</b> lets her push, branch and open pull requests. Read would not let her push. Admin could delete the repository or change who has access, and the owner role would give her control of the whole organization.' },
      { id: 'a4-q-team', type: 'mc', prompt: 'Twenty students of one class all need Write on the same ten repositories. What is the easiest way to manage that?',
        options: ['Add each student to each repository by hand', 'Put the students in a team and give the team the role', 'Make every student an organization owner', 'Make the repositories public'],
        answer: 1, hints: ['One change should update many repositories.'],
        explain: 'A team gives access once and updates everywhere when people join or leave. Making students owners or the repositories public gives away far more than needed.' },
      { id: 'a4-q-order', type: 'order', prompt: 'Put the submission workflow in order.',
        items: ['The supervisor creates the repository from the template', 'The supervisor gives the student Write access', 'The student clones and pushes regularly', 'The student tags v1.0-submitted and pushes the tag', 'The supervisor archives the repository'],
        explain: 'Access comes before work, the tag marks the finished work, and archiving comes last because it makes the repository read-only.' },
      { id: 'a4-q-tag', type: 'fill', prompt: 'Aino created the tag locally. Complete the command that sends it to GitHub.',
        text: '[[a]]', answer: { a: ['git push origin v1.0-submitted', 'git push --tags', 'git push origin --tags'] },
        hints: ['A normal git push sends commits only.'],
        explain: 'Tags are not sent by a normal <code>git push</code>. Name the tag, or use <code>--tags</code> to send all of them.' },
      { id: 'a4-q-may', type: 'multi', prompt: 'Aino has Write on <code>thesis-2026-virtanen</code>. Which of these can she do?',
        options: ['Open a pull request', 'Push a new branch', 'Delete the repository', 'Add her friend as a collaborator', 'Comment on an issue'], answer: [0, 1, 4],
        explain: 'Pull requests, branches and issues are daily work and need only Write. Adding people and deleting the repository need Admin, and deleting also needs an organization owner (unless the owners allowed members).' },
      { id: 'a4-q-archive', type: 'mc', prompt: 'The repository is archived. Aino runs <code>git push</code>. What happens?',
        options: ['The push works, but the commit is hidden', 'The push is refused because the repository is read-only', 'The repository is unarchived automatically', 'The repository is deleted'],
        answer: 1, hints: ['Read-only means nobody can change it.'],
        explain: 'Archived repositories are read-only for everyone. Viewing and cloning still work. An Admin has to unarchive it before anyone can push again.' },
      { id: 'a4-q-transfer', type: 'mc', prompt: 'Which is required to transfer <code>aino/thesis-draft</code> (her own repository) into <code>hamk-projects</code>?',
        options: ['Aino is Admin of the repository and may create repositories in hamk-projects', 'Only the teacher can ever do it', 'The repository must be public', 'The repository must first be archived'],
        answer: 0, hints: ['Two conditions: one about the source, one about the target.'],
        explain: 'You need Admin on the repository and the right to create repositories in the target. Visibility and archived state do not matter. For a repository already owned by the organization, transferring also needs an organization owner (unless the owners allow members).' }
    ]
  });
})();
