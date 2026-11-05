/* a2 = Repository roles: who can do what (roles learn widget + github widget with personas). */
(function () {
  var SLUG = 'hamk-projects/thesis-aino';
  var CFG = { 'user.name': 'Teacher', 'user.email': 'teacher@example.com' };

  TDC.registerTopic({
    id: 'a2',
    title: 'Repository roles: who can do what',
    subtitle: 'Five roles, one base permission and a few organization rules decide what each person may do. Learn to give just enough.',
    audience: 'teachers, supervisors and IT staff · you know what an organization is',
    objectives: [
      'list what Read, Triage, Write, Maintain and Admin can do',
      'work out a person\'s effective access from the base permission, teams and direct access',
      'set the base permission and give one person a role on one repository',
      'explain why a student with Admin still cannot delete a repository',
      'choose the smallest role and the right visibility for a thesis, course material and a public showcase'
    ],
    glossary: {
      reporole: { term: 'repository role', def: 'A named level of access to <em>one</em> repository: Read, Triage, Write, Maintain or Admin. Each role includes everything the roles below it can do.' },
      basepermission: { term: 'base permission', def: 'An organization setting: the role every member gets on every repository in the organization (No permission, Read, Write or Admin), before any team or personal access is added.' },
      leastprivilege: { term: 'least privilege', def: 'Give each person only the access they need for their task, and no more. It limits the damage from mistakes and stolen accounts.' }
    },
    commands: [],
    sections: [
      { id: 'a2-ladder', title: 'The five roles', blocks: [
        { id: 'a2-ladder-t', type: 'text', html: '<p>In an organization you do not decide "can Aino use GitHub?". You decide what she may do in <em>each repository</em>. GitHub gives five <dfn data-term="reporole">repository roles</dfn>, from the safest to the most powerful: <b>Read, Triage, Write, Maintain, Admin</b>. Every role can do everything the roles before it can.</p>' },
        { id: 'a2-ladder-tbl', type: 'table', head: ['Role', 'In one sentence', 'Typical person at HAMK'], rows: [
          ['<b>Read</b>', 'Look at the code, clone it, open issues and comment.', 'Every student on course material'],
          ['<b>Triage</b>', 'Also manage issues and pull requests (labels, assignees, close) without touching code.', 'Teaching assistant'],
          ['<b>Write</b>', 'Also push commits, create branches, merge pull requests.', 'Student on their own thesis'],
          ['<b>Maintain</b>', 'Also manage the repository day to day, but not the risky settings.', 'Project lead in a summer project'],
          ['<b>Admin</b>', 'Also manage access, rulesets and archiving for this repository.', 'Supervisor']
        ] },
        { id: 'a2-ladder-sim', type: 'interactive', widget: 'roles', title: 'Compare the roles',
          caption: 'Pick a role to highlight its column. A tick means allowed; a dash means not allowed.',
          config: { focus: 'read', owner: true, tasks: [
            { id: 'triage', text: 'Pick <b>Triage</b> and see what it adds to Read', check: function (s) { return !!s.picked.triage; } },
            { id: 'write', text: 'Pick <b>Write</b>: this is what a student needs on a thesis', check: function (s) { return !!s.picked.write; } },
            { id: 'admin', text: 'Pick <b>Admin</b> and look at the last two rows (visibility, delete or transfer)', check: function (s) { return !!s.picked.admin; } },
            { id: 'owner', text: 'Pick <b>Org owner</b>: the only column with every tick', check: function (s) { return !!s.picked.owner; } }
          ] } },
        { id: 'a2-ladder-c', type: 'callout', kind: 'warn', title: 'Admin is not "owner"', html: 'A repository <b>Admin</b> controls one repository. An organization <b>owner</b> controls the whole organization and is Admin everywhere. Deleting, transferring and changing the visibility of a repository are reserved for owners unless the organization allows members to do it (see the last section).' },
        { id: 'a2-q-ladder-blk', type: 'question', q: 'a2-q-ladder' }
      ] },
      { id: 'a2-effective', title: 'Where a person\'s role comes from', blocks: [
        { id: 'a2-eff-t', type: 'text', html: '<p>A person can receive access to a repository in three ways. GitHub adds them up and gives the person the <b>highest</b> one:</p>' },
        { id: 'a2-eff-l', type: 'list', ordered: true, items: [
          'The <dfn data-term="basepermission">base permission</dfn>: set once for the whole organization and applied to every member (<b>No permission</b>, <b>Read</b>, <b>Write</b> or <b>Admin</b>). Set in <b>Settings → Member privileges</b> of the organization.',
          'A <b>team</b> that has been given a role on the repository. Everyone in the team gets it.',
          'A <b>direct</b> role given to one person on the repository (<b>Settings → Collaborators and teams</b> in the repository).'        ] },
        { id: 'a2-eff-c', type: 'callout', kind: 'key', title: 'Highest wins, nothing subtracts', html: 'You can only <em>add</em> access above the base permission. If the base permission is Write, you cannot give one member "less than Write" on a repository. To keep a repository private from other members, set the base permission to <b>No permission</b> or <b>Read</b> and add access where needed.' },
        { id: 'a2-eff-ex', type: 'example', title: 'Work out Ben\'s role', problem: 'Base permission is <b>Read</b>. Ben is in the team <code>thesis-2026</code>, which has <b>Write</b> on <code>thesis-aino</code>. Nobody gave Ben direct access. What can Ben do on <code>thesis-aino</code>?',
          steps: ['Base permission gives him Read.', 'His team gives him Write.', 'Highest wins: Write.'], result: 'Ben is a Write user on thesis-aino, and Read on every other repository in the organization.', badge: 'Worked example' },
        { id: 'a2-eff-c2', type: 'callout', kind: 'school', title: 'Visibility sets the outer limit', html: '<b>Private</b>: only people who were given access (plus owners). <b>Internal</b>: every member of the organization can read it (needs an Enterprise plan). <b>Public</b>: the whole world can read and clone it, but only people with a role can change it.' },        { id: 'a2-q-eff-blk', type: 'question', q: 'a2-q-effective' },
        { id: 'a2-q-owner-blk', type: 'question', q: 'a2-q-owner' }
      ] },
      { id: 'a2-practice', title: 'Practice: set up the thesis repository', blocks: [
        { id: 'a2-pr-t', type: 'text', html: '<p>The organization <code>hamk-projects</code> was created with the base permission left at <b>Write</b>. That means every member, including Ben, can currently change Aino\'s thesis. Fix it as the teacher, then see what the students can do. Use the <b>Practise as</b> buttons to switch person.</p>' },
        { id: 'a2-pr-sim', type: 'interactive', widget: 'github', title: 'Set the base permission and give Aino Write',
          caption: 'Start as teacher. The organization settings page is open. Nothing here leaves your computer.',
          config: {
            start: '/orgs/hamk-projects/settings/privileges', personas: ['teacher', 'aino', 'ben'], terminal: false,
            world: { me: 'teacher', myName: 'Tiina Teacher', config: CFG,
              users: { teacher: { name: 'Tiina Teacher' }, aino: { name: 'Aino Student' }, ben: { name: 'Ben Opiskelija' } },
              orgs: { 'hamk-projects': { displayName: 'HAMK Projects', owners: ['teacher'], members: ['aino', 'ben'], settings: { basePermission: 'write', membersCanDelete: false } } },
              remotes: { 'hamk-projects/thesis-aino': { visibility: 'private', description: 'Bachelor thesis: version control at HAMK',
                commits: [{ msg: 'Initial commit', author: 'teacher', files: { 'README.md': '# Thesis: Aino Student\n' } }] } },
              run: [] },
            tasks: [
              { id: 'base', text: 'As <b>teacher</b>, set the base permission to <b>Read</b> (<b>Member privileges</b>)', check: function (w) { return w.server.orgs['hamk-projects'].settings.basePermission === 'read'; }, hint: 'It is the first drop-down on the Member privileges page.', solution: 'Base permissions drop-down: Read' },
              { id: 'ben', text: 'Check that Ben now has only <b>Read</b> on the thesis (open the repository, <b>Settings → Collaborators and teams</b>)', check: function (w) { return w.roleOf('ben', SLUG) === 'read' && w.did('visit', function (e) { return /\/settings\/access$/.test(e.path); }); }, hint: 'The Settings tab is at the top of the repository page.' },
              { id: 'aino', text: 'Give <b>aino</b> the <b>Write</b> role on <code>thesis-aino</code> (<b>Add people</b>)', check: function (w) { return w.server.repos[SLUG].collaborators.aino === 'write'; }, hint: 'Repository Settings → Collaborators and teams → Add people.', solution: 'Add people → aino → role Write' },
              { id: 'push', text: 'Switch to <b>aino</b> and open the repository: she can edit files, Ben cannot (switch to <b>ben</b> to compare)', check: function (w) { return w.me === 'aino' && w.roleRank(w.roleOf('aino', SLUG)) >= w.roleRank('write'); } },   // Admin also edits: do not block learners who skipped ahead
              { id: 'admin', text: 'Make <b>aino</b> an <b>Admin</b> of the thesis (as teacher)', check: function (w) { return w.server.repos[SLUG].collaborators.aino === 'admin'; }, hint: 'Same page: change her role to Admin.' },
              { id: 'denied', text: 'As <b>aino</b>, open <b>Settings</b> and press <b>Delete this repository</b>: GitHub refuses', check: function (w) { return w.roleOf('aino', SLUG) === 'admin' && w.did('denied', function (e) { return e.action === 'delete'; }); }, hint: 'The Danger Zone is at the bottom of Settings → General.' }
            ] } },
        { id: 'a2-pr-c', type: 'callout', kind: 'warn', title: 'Why Admin could not delete', html: 'Aino is an Admin of this repository, yet <b>Delete this repository</b> was refused. The organization setting <b>Allow members to delete or transfer repositories for this organization</b> is off, so only owners can. That is the default and the safe choice at a school. Leave it off.' },        { id: 'a2-pr-c2', type: 'callout', kind: 'info', title: 'Practice copy', html: 'The simulator shows the real page names, but the real GitHub has a few more options on these pages. The roles and the outcomes are the same.' },
        { id: 'a2-q-admin-blk', type: 'question', q: 'a2-q-admin' }
      ] },
      { id: 'a2-scenarios', title: 'Choosing roles: three school scenarios', blocks: [
        { id: 'a2-sc-t', type: 'text', html: '<p>Follow <dfn data-term="leastprivilege">least privilege</dfn>: start with the smallest role that lets the person do their work. It is easy to raise a role later and hard to undo a deleted branch or a leaked project.</p>' },
        { id: 'a2-sc-tbl', type: 'table', head: ['Scenario', 'Base permission', 'Who gets what', 'Visibility'], rows: [
          ['<b>Thesis repository</b> <code>thesis-aino</code>', 'No permission', 'Student: <b>Write</b> (team or direct). Supervisor: <b>Admin</b> (via a staff team). Others: nothing.', 'Private'],
          ['<b>Course material</b>', 'Read', 'Teachers\' team: <b>Write</b>. Teaching assistant: <b>Triage</b>. Students read through the base permission.', 'Private (or internal on Enterprise)'],
          ['<b>Public showcase</b> of finished projects', 'Read', 'Student team: <b>Write</b>. Project lead: <b>Maintain</b>.', 'Public: after checking nothing private is inside']
        ], caption: 'Suggested defaults. Adapt to your course.' },
        { id: 'a2-sc-c', type: 'callout', kind: 'school', title: 'Students never need Admin', html: 'On a thesis the student needs <b>Write</b>. The supervisor keeps <b>Admin</b>, so access, rules and archiving at the end of the project stay with the school, not with someone who is leaving.' },
        { id: 'a2-sc-det', type: 'details', summary: 'What about a person outside the organization?', html: 'An <b>outside collaborator</b> is not a member, so the base permission does not apply to them. They only get the roles you give them directly on specific repositories. Use this for an external examiner or a company partner.' },
        { id: 'a2-q-scn-blk', type: 'question', q: 'a2-q-scenario' },
        { id: 'a2-q-match-blk', type: 'question', q: 'a2-q-match' }
      ] },
      { id: 'a2-summary', title: 'Summary', blocks: [
        { id: 'a2-sum-l', type: 'list', items: [
          'Five repository roles, each including the one before: <b>Read, Triage, Write, Maintain, Admin</b>.',
          'A person\'s role is the <b>highest</b> of the base permission, their teams and their direct access.',
          'Set the <b>base permission</b> low (No permission or Read) and add access where needed.',
          '<b>Delete, transfer and change visibility</b> are for organization owners, unless the organization allows members to.',
          'Give the smallest role that works: students <b>Write</b>, supervisors <b>Admin</b>.'
        ] }
      ] }
    ],
    questions: [
      { id: 'a2-q-ladder', type: 'mc', prompt: 'A teaching assistant must label and close issues and pull requests, but must not push code. Which role fits best?',
        options: ['Read', 'Triage', 'Write', 'Maintain'], answer: 1, shuffle: false, hints: ['Which role is the first to manage issues but not code?'],
        explain: '<b>Triage</b> manages issues and pull requests without write access to the code. Read cannot label or close; Write and Maintain could change the code.' },
      { id: 'a2-q-effective', type: 'mc', prompt: 'The base permission is <b>Read</b>. Ben is in a team with <b>Write</b> on a repository, and also has direct <b>Triage</b> on it. What is his role there?',
        options: ['Read', 'Triage', 'Write', 'Triage and Write added together give Maintain'], answer: 2, hints: ['GitHub takes the highest of the sources.'],
        explain: 'Access from the base permission, teams and direct roles is compared and the <b>highest</b> wins: Write. Roles are never added up into a new role.' },
      { id: 'a2-q-owner', type: 'multi', prompt: 'Which of these can an organization <b>owner</b> do that a repository Admin normally cannot?',
        options: ['Delete a repository', 'Add a person to the repository', 'Change a repository\'s visibility', 'Create a ruleset on the repository'], answer: [0, 2],
        hints: ['Think about the two settings that are off by default for members.'],
        explain: 'Deleting/transferring and changing visibility are owner-only unless the organization lets members do them. Admins can manage access and rulesets.' },
      { id: 'a2-q-admin', type: 'mc', prompt: 'Aino has Admin on <code>thesis-aino</code>, but the delete button is refused. What is the most likely reason?',
        options: ['Admin cannot delete anything on GitHub', 'The organization has not allowed members to delete or transfer repositories', 'Aino has not verified her email', 'The thesis repository is public'],
        answer: 1, hints: ['It is an organization setting, not a repository role.'],
        explain: 'Only owners may delete unless the organization setting <b>Allow members to delete or transfer repositories</b> is on. Admins can delete in a personal account or where that setting is on.' },
      { id: 'a2-q-scenario', type: 'mc', prompt: 'Every student should read the course material, only the teachers should change it. What is the best setup?',
        options: ['Base permission Write, everyone else nothing to do', 'Base permission Read, plus a teachers\' team with Write', 'Base permission None, add every student one by one as Read', 'Make every student an Admin'],
        answer: 1, hints: ['Use the base permission for the many, a team for the few.'],
        explain: 'Base Read gives all members read access in one setting. The teachers\' team adds Write only for them. Base Write would let every student change the material.' },
      { id: 'a2-q-match', type: 'match', prompt: 'Match the person to the smallest role that fits.', pairs: [
        ['Student writing a thesis', 'Write'], ['Supervisor of the thesis', 'Admin'], ['Student who may only look at course material', 'Read'], ['Project lead who runs a summer project day to day', 'Maintain']
      ], explain: 'Least privilege: the thesis student needs Write, the supervisor keeps Admin, readers get Read, and a project lead can run the repository with Maintain.' }
    ]
  });
})();
