/* Lesson registry: levels, then lessons in study order (home page cards, prev/next, progress).
 * To add a lesson: add an entry here, create content/<id>-<slug>.js (TDC.registerTopic) and add its <script>
 * tag to index.html. The curriculum and the reasoning behind it: docs/CURRICULUM.md. */
(function () {
  var S = 'fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"';
  var I = {
    history: '<circle ' + S + ' cx="32" cy="32" r="24"/><path ' + S + ' d="M32 18v15l10 6"/><path ' + S + ' d="M8 20l2 9 9-3"/>',
    cloud: '<path ' + S + ' d="M18 46h30a11 11 0 0 0 0-22 15 15 0 0 0-29-3A12 12 0 0 0 18 46z"/><path ' + S + ' d="M32 30v12M26 36l6-6 6 6"/>',
    browser: '<rect ' + S + ' x="6" y="10" width="52" height="44" rx="4"/><path ' + S + ' d="M6 20h52M13 15h1M19 15h1M25 15h1"/><path ' + S + ' d="M16 30h20M16 38h32M16 46h26"/>',
    upload: '<path ' + S + ' d="M10 42v10h44V42M32 40V10M20 22l12-12 12 12"/>',
    terminal: '<rect ' + S + ' x="6" y="10" width="52" height="44" rx="4"/><path ' + S + ' d="M16 26l8 6-8 6M30 40h16"/>',
    stack: '<path ' + S + ' d="M32 8 6 20l26 12 26-12zM6 32l26 12 26-12M6 44l26 12 26-12"/>',
    clock: '<circle ' + S + ' cx="18" cy="16" r="6"/><circle ' + S + ' cx="18" cy="48" r="6"/><circle ' + S + ' cx="46" cy="32" r="6"/><path ' + S + ' d="M18 22v20M24 18c14 2 16 8 18 10"/>',
    sync: '<path ' + S + ' d="M10 26a22 22 0 0 1 40-8M54 38a22 22 0 0 1-40 8"/><path ' + S + ' d="M50 8v10H40M14 56V46h10"/>',
    ignore: '<path ' + S + ' d="M14 6h24l12 12v40H14z"/><path ' + S + ' d="M38 6v12h12"/><path ' + S + ' d="M22 30l20 20M42 30 22 50"/>',
    branch: '<circle ' + S + ' cx="18" cy="12" r="6"/><circle ' + S + ' cx="18" cy="52" r="6"/><circle ' + S + ' cx="46" cy="20" r="6"/><path ' + S + ' d="M18 18v28M46 26c0 14-28 8-28 20"/>',
    conflict: '<path ' + S + ' d="M10 14h18M10 24h18M36 40h18M36 50h18"/><path ' + S + ' d="M28 19c8 0 8 26 8 26" stroke-dasharray="4 5"/><path ' + S + ' d="M44 8l-6 12h10l-6 12"/>',
    undo: '<path ' + S + ' d="M22 14 10 26l12 12"/><path ' + S + ' d="M10 26h28a14 14 0 0 1 0 28H24"/>',
    pr: '<circle ' + S + ' cx="16" cy="14" r="6"/><circle ' + S + ' cx="16" cy="50" r="6"/><circle ' + S + ' cx="48" cy="50" r="6"/><path ' + S + ' d="M16 20v24M48 44V24a8 8 0 0 0-8-8H30M36 10l-6 6 6 6"/>',
    issue: '<circle ' + S + ' cx="32" cy="32" r="24"/><circle cx="32" cy="32" r="4" fill="currentColor"/>',
    doc: '<path ' + S + ' d="M14 6h24l12 12v40H14z"/><path ' + S + ' d="M38 6v12h12M22 30h20M22 38h20M22 46h12"/>',
    org: '<circle ' + S + ' cx="32" cy="18" r="8"/><circle ' + S + ' cx="12" cy="46" r="6"/><circle ' + S + ' cx="32" cy="48" r="6"/><circle ' + S + ' cx="52" cy="46" r="6"/><path ' + S + ' d="M32 26v16M26 24 14 40M38 24l12 16"/>',
    roles: '<rect ' + S + ' x="8" y="8" width="48" height="48" rx="4"/><path ' + S + ' d="M8 24h48M8 40h48M24 8v48"/><path ' + S + ' d="M32 16l4 4 8-8M32 48l4 4 8-8"/>',
    shield: '<path ' + S + ' d="M32 6 10 14v16c0 14 9 24 22 28 13-4 22-14 22-28V14z"/><path ' + S + ' d="M22 32l7 7 13-14"/>',
    school: '<path ' + S + ' d="M4 24 32 10l28 14-28 14z"/><path ' + S + ' d="M16 30v14c8 8 24 8 32 0V30M58 24v16"/>',
    key: '<circle ' + S + ' cx="20" cy="40" r="12"/><path ' + S + ' d="M28 32 54 6M44 16l8 8M38 22l6 6"/>',
    tag: '<path ' + S + ' d="M8 8h22l26 26-22 22L8 30z"/><circle ' + S + ' cx="20" cy="20" r="4"/>',
    rebase: '<circle ' + S + ' cx="14" cy="50" r="6"/><circle ' + S + ' cx="14" cy="14" r="6"/><circle ' + S + ' cx="46" cy="14" r="6" stroke-dasharray="4 4"/><circle ' + S + ' cx="46" cy="38" r="6"/><path ' + S + ' d="M14 20v24M20 14h20M46 20v12M40 44 20 50"/>',
    cube: '<path ' + S + ' d="M32 6 8 18v28l24 12 24-12V18zM8 18l24 12 24-12M32 30v28"/>',
    box: '<rect ' + S + ' x="8" y="18" width="48" height="36" rx="3"/><path ' + S + ' d="M4 10h56v8H4zM26 30h12"/>',
    gear: '<circle ' + S + ' cx="32" cy="32" r="9"/><path ' + S + ' d="M32 4v10M32 50v10M4 32h10M50 32h10M12 12l7 7M45 45l7 7M12 52l7-7M45 19l7-7"/>',
    admin: '<rect ' + S + ' x="6" y="10" width="52" height="40" rx="4"/><path ' + S + ' d="M6 20h52M18 32h8M18 40h14M40 30l6 6-6 6"/>',
    flow: '<circle ' + S + ' cx="12" cy="32" r="6"/><circle ' + S + ' cx="52" cy="32" r="6"/><path ' + S + ' d="M18 32h28M24 32c4-16 12-16 16 0M24 32c4 16 12 16 16 0"/>',
    trophy: '<path ' + S + ' d="M20 8h24v14a12 12 0 0 1-24 0zM20 14H8c0 10 6 14 12 14M44 14h12c0 10-6 14-12 14M32 34v12M22 56h20M26 46h12v10H26z"/>'
  };
  function icon(k) { return '<svg viewBox="0 0 64 64">' + I[k] + '</svg>'; }

  TDC.levels = [
    { id: 'beginner', num: 1, color: 'var(--t3)', title: 'Beginner: first steps',
      summary: 'What version control is, a tour of GitHub, saving work in the browser or with Git on your own computer, and sending it to the school.' },
    { id: 'intermediate', num: 2, color: 'var(--t1)', title: 'Intermediate: working with others',
      summary: 'Good commits, branches, merge conflicts, undoing safely, pull requests, issues and well-documented repositories.' },
    { id: 'advanced', num: 3, color: 'var(--t4)', title: 'Advanced: the school’s organization, permissions and access',
      summary: 'Organizations, teams and roles; who may push, approve and delete; protected branches; submitting student projects; secure sign-in.' },
    { id: 'expert', num: 4, color: 'var(--t2)', title: 'Expert: power tools and administration',
      summary: 'Rewriting history, Git internals and recovery, large files, automation with Actions, running the organization and team workflows.' }
  ];

  // id: unique lesson id (prefix of every block/question id inside the lesson). track: git | github | both.
  TDC.topicList = [
    { id: 'b1', num: '1.1', level: 'beginner', track: 'both', minutes: 15, icon: icon('history'),
      title: 'Why version control?', summary: 'From “thesis_FINAL_v3_really.docx” to a clear history: what Git and GitHub are, and why the school keeps projects on GitHub.' },
    { id: 'b2', num: '1.2', level: 'beginner', track: 'github', minutes: 15, icon: icon('school'),
      title: 'Your GitHub account and the school organization', summary: 'Create an account, secure it, and join the school’s organization so your work belongs to the school, not to one laptop.' },
    { id: 'b3', num: '1.3', level: 'beginner', track: 'github', minutes: 20, icon: icon('browser'),
      title: 'A tour of a repository page', summary: 'Every part of a repository page on GitHub: files, README, branches, history, Code button, tabs. Find them in the simulator.' },
    { id: 'b4', num: '1.4', level: 'beginner', track: 'github', minutes: 20, icon: icon('upload'),
      title: 'Working in the browser: upload, edit, commit', summary: 'No installation needed: upload files, edit text, write a commit message and look at the history, all on github.com.' },
    { id: 'b5', num: '1.5', level: 'beginner', track: 'git', minutes: 20, icon: icon('terminal'),
      title: 'Install Git and set it up', summary: 'Install Git (and optionally GitHub Desktop and VS Code) on Windows, macOS or Linux, then tell Git who you are.' },
    { id: 'b6', num: '1.6', level: 'beginner', track: 'git', minutes: 30, icon: icon('stack'),
      title: 'Your first repository: the three areas', summary: 'init, status, add, commit: the working folder, the staging area and the repository, in the terminal, GitHub Desktop and VS Code.' },
    { id: 'b7', num: '1.7', level: 'beginner', track: 'git', minutes: 20, icon: icon('clock'),
      title: 'Looking back: history and differences', summary: 'Read the history with log, see exactly what changed with diff and show, and bring back an old version of a file.' },
    { id: 'b8', num: '1.8', level: 'beginner', track: 'both', minutes: 30, icon: icon('sync'),
      title: 'Clone, push and pull', summary: 'Connect your computer to a school repository: download it, send your commits, and get other people’s changes.' },

    { id: 'i1', num: '2.1', level: 'intermediate', track: 'git', minutes: 20, icon: icon('ignore'),
      title: 'What to commit: good commits and .gitignore', summary: 'Small commits with clear messages, files that never belong in a repository (passwords, build output), and .gitignore.' },
    { id: 'i2', num: '2.2', level: 'intermediate', track: 'git', minutes: 30, icon: icon('branch'),
      title: 'Branches', summary: 'Work on an idea without touching the main version: create, switch and merge branches, and read the commit graph.' },
    { id: 'i3', num: '2.3', level: 'intermediate', track: 'git', minutes: 25, icon: icon('conflict'),
      title: 'Merge conflicts', summary: 'Why conflicts happen, how to read the markers, and how to resolve them in the terminal and in VS Code.' },
    { id: 'i4', num: '2.4', level: 'intermediate', track: 'git', minutes: 25, icon: icon('undo'),
      title: 'Undoing things safely', summary: 'restore, amend, revert and reset: which undo to use when, and which ones are safe after you have pushed.' },
    { id: 'i5', num: '2.5', level: 'intermediate', track: 'github', minutes: 30, icon: icon('pr'),
      title: 'Pull requests and code review', summary: 'Propose a change, review it, request changes, approve and merge, with or without write access (forks).' },
    { id: 'i6', num: '2.6', level: 'intermediate', track: 'github', minutes: 20, icon: icon('issue'),
      title: 'Issues, labels and project boards', summary: 'Plan and track work: issues for tasks and feedback, labels, assignees, milestones, closing issues from commits, Projects.' },
    { id: 'i7', num: '2.7', level: 'intermediate', track: 'github', minutes: 20, icon: icon('doc'),
      title: 'A repository others can use: README, licence, Markdown', summary: 'Write a README that lets the next person continue the project, choose a licence, and use Markdown and templates.' },

    { id: 'a1', num: '3.1', level: 'advanced', track: 'github', minutes: 25, icon: icon('org'),
      title: 'Organizations, members and teams', summary: 'How the school’s organization is built: owners, members, outside collaborators, and teams for departments, courses and theses.' },
    { id: 'a2', num: '3.2', level: 'advanced', track: 'github', minutes: 30, icon: icon('roles'),
      title: 'Repository roles: who can do what', summary: 'Read, Triage, Write, Maintain and Admin; base permissions; why students can push but cannot delete the repository.' },
    { id: 'a3', num: '3.3', level: 'advanced', track: 'github', minutes: 30, icon: icon('shield'),
      title: 'Protecting the main branch: rulesets and reviews', summary: 'Everyone can read and clone, but changes reach main only through an approved pull request. Rulesets, code owners, bypass.' },
    { id: 'a4', num: '3.4', level: 'advanced', track: 'both', minutes: 30, icon: icon('school'),
      title: 'Submitting student projects to the school', summary: 'The full workflow for a summer project or thesis: template, naming, access, supervision, hand-in tag, archive, offboarding.' },
    { id: 'a5', num: '3.5', level: 'advanced', track: 'both', minutes: 30, icon: icon('key'),
      title: 'Signing in securely: 2FA, SSH keys and tokens', summary: 'Two-factor authentication, SSH keys, fine-grained personal access tokens, and what to do when a secret leaks.' },
    { id: 'a6', num: '3.6', level: 'advanced', track: 'both', minutes: 20, icon: icon('tag'),
      title: 'Tags, releases and stash', summary: 'Mark the submitted version with a tag, publish a release with the PDF attached, and park unfinished work with stash.' },

    { id: 'e1', num: '4.1', level: 'expert', track: 'git', minutes: 30, icon: icon('rebase'),
      title: 'Rewriting history: rebase and cherry-pick', summary: 'Rebase versus merge, interactive rebase to tidy commits, cherry-pick, and the golden rule of shared history.' },
    { id: 'e2', num: '4.2', level: 'expert', track: 'git', minutes: 30, icon: icon('cube'),
      title: 'Inside Git: objects, refs and recovery', summary: 'Blobs, trees, commits and refs; HEAD and detached HEAD; recovering “lost” work with the reflog.' },
    { id: 'e3', num: '4.3', level: 'expert', track: 'both', minutes: 20, icon: icon('box'),
      title: 'Large files and research data', summary: 'Why big binaries hurt a repository, Git LFS, size limits, and where datasets should live instead.' },
    { id: 'e4', num: '4.4', level: 'expert', track: 'github', minutes: 30, icon: icon('gear'),
      title: 'Automation with GitHub Actions', summary: 'Workflows that check every pull request or build the thesis PDF; required status checks; secrets in Actions.' },
    { id: 'e5', num: '4.5', level: 'expert', track: 'github', minutes: 30, icon: icon('admin'),
      title: 'Running the school organization', summary: 'For administrators: member privileges, onboarding and offboarding, audit log, org-wide rules, templates and backups.' },
    { id: 'e6', num: '4.6', level: 'expert', track: 'both', minutes: 30, icon: icon('trophy'),
      title: 'Team workflows and the capstone', summary: 'GitHub flow, Git flow and trunk-based development, commit conventions, signed commits, then set up a thesis repository end to end.' }
  ];
})();
