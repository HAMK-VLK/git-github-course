/* a1 = Organizations, members and teams (github widget on org pages, persona it-admin).
 * Simulator limits: no billing manager role, no team maintainers, no secret/visible team switch (taught in text only). */
(function () {
  var USERS = { teacher: { name: 'Tiina Teacher' }, aino: { name: 'Aino Student' }, ben: { name: 'Ben Opiskelija' }, clara: { name: 'Clara Assistant' }, 'it-admin': { name: 'Ilkka IT-admin' } };
  var REPOS = {
    'hamk-projects/thesis-aino': { description: 'Bachelor thesis: version control at HAMK', commits: [{ msg: 'Initial commit', author: 'teacher', files: { 'README.md': '# Thesis: Aino Student\n' } }] },
    'hamk-projects/course-web-dev': { description: 'Course material: web development', commits: [{ msg: 'Initial commit', author: 'teacher', files: { 'README.md': '# Web development\n' } }] }
  };
  function org(extra) {
    var o = { displayName: 'HAMK Projects', owners: ['teacher', 'it-admin'], members: ['aino'], settings: { basePermission: 'read' }, teams: {} };
    for (var k in extra) o[k] = extra[k];
    return { 'hamk-projects': o };
  }
  function world(extra, repos) { return { me: 'it-admin', myName: 'Ilkka IT-admin', users: USERS, orgs: org(extra), remotes: repos || REPOS, run: [] }; }

  TDC.registerTopic({
    id: 'a1',
    title: 'Organizations, members and teams',
    subtitle: 'Run the school\'s GitHub home: invite people, group them in teams and give the teams access.',
    audience: 'teachers, IT staff and advanced students · you have used GitHub with an organization',
    objectives: [
      'explain why school projects belong to an organization and not to a personal account',
      'tell owners, members, outside collaborators and billing managers apart',
      'invite a person to the organization and read the pending invitations',
      'create a team (also a nested one), add members and give it a role on a repository',
      'remove a leaving person or turn them into an outside collaborator'
    ],
    glossary: {
      organization: { term: 'organization', def: 'A shared GitHub account owned by a group, such as the school. It holds repositories, teams and people, and is run by its owners.' },
      team: { term: 'team', def: 'A named group of organization members, such as <code>thesis-2026</code>. You give the team a role on repositories once, and everyone in it gets that access.' },
      outsidecollab: { term: 'outside collaborator', def: 'A person who is <em>not</em> a member of the organization but has been given access to one or more of its repositories, for example an external examiner.' }
    },
    commands: [],
    sections: [
      { id: 'a1-why', title: 'Why projects live in the organization', blocks: [
        { id: 'a1-why-t', type: 'text', html: '<p>A repository belongs to exactly one <em>owner</em>: a personal account or an <dfn data-term="organization">organization</dfn>. If Aino keeps her thesis under her own account, she is the only one who decides its fate. When she graduates, closes the account or changes her email, the project goes with her.</p><p>Under <code>hamk-projects</code> the school keeps control. People come and go, the repositories stay, and the history of every thesis and summer project is still there years later.</p>' },
        { id: 'a1-why-tbl', type: 'table', head: ['', 'In a personal account', 'In the organization'], rows: [
          ['Who owns it?', 'One person', 'The school (its owners)'],
          ['When that person leaves', 'Project may disappear or be locked', 'Owners remove the person; the project stays'],
          ['Who can see all projects?', 'Nobody but the author', 'Owners, and members as the settings allow'],
          ['Access', 'Added one by one', 'Granted to <dfn data-term="team">teams</dfn> in one step']
        ] },
        { id: 'a1-why-c', type: 'callout', kind: 'school', title: 'HAMK rule of thumb', html: 'School work (theses, summer projects, course material) is created in <code>hamk-projects</code> from the start. Moving a repository later is possible, but it is easier never to need it.' },
        { id: 'a1-q-why-blk', type: 'question', q: 'a1-q-why' }
      ] },
      { id: 'a1-roles', title: 'The kinds of people', blocks: [
        { id: 'a1-roles-t', type: 'text', html: '<p>Everyone who touches an organization is one of these. The first two are the everyday ones; <b>Outside collaborators</b> are the way to give someone limited access without making them part of the school.</p>' },
        { id: 'a1-roles-tbl', type: 'table', head: ['Kind', 'What they are', 'Example'], rows: [
          ['<dfn data-term="owner">Owner</dfn>', 'Full control: people, teams, settings, every repository, deleting. Keep few (two or three) and always more than one, so the organization never depends on a single person.', '<code>teacher</code>, <code>it-admin</code>'],
          ['Member', 'Belongs to the organization. What they may do in a repository depends on the base permission, their teams and direct grants.', '<code>aino</code>, <code>ben</code>'],
          ['<dfn data-term="outsidecollab">Outside collaborator</dfn>', 'Not a member. Has access only to the specific repositories they were added to. Cannot see other repositories or the member list.', 'An external examiner'],
          ['Billing manager', 'Sees and changes payment details only, with no access to the code. Useful for a finance department.', 'Accounting staff']        ] },
        { id: 'a1-roles-c', type: 'callout', kind: 'warn', title: 'Owners can do everything', html: 'An owner is administrator of every repository, whatever the repository settings say. Do not make a student an owner "to save time". Use a team role on the one repository instead.' },
        { id: 'a1-q-roles-blk', type: 'question', q: 'a1-q-roles' }
      ] },
      { id: 'a1-invite', title: 'Invite people', blocks: [
        { id: 'a1-invite-t', type: 'text', html: '<p>Only owners invite. On the organization page open <b>People</b>, press <b>Invite member</b> and type the person\'s GitHub username or email. Pick their role in the organization (<b>Member</b> unless you really need an owner). The person gets an email and accepts it, as you did when you joined.</p><p>Until they accept, the person is listed under <b>Pending invitations</b>. Invitations expire after seven days, so remind people or send a new one.</p>' },        { id: 'a1-invite-sim', type: 'interactive', widget: 'github', title: 'Invite Ben to the organization',
          caption: 'You are signed in as it-admin, an owner. Practise the owner view of the People page.',
          config: {
            start: '/orgs/hamk-projects/people', terminal: false,
            world: world({ members: ['aino'] }),
            tasks: [
              { id: 'invite', text: 'Invite <code>ben</code> as a <b>Member</b>',
                check: function (w) { return w.server.orgs['hamk-projects'].invites.some(function (i) { return i.login === 'ben' && i.role === 'member'; }); },
                hint: 'Open the People page and press the green Invite member button.', solution: 'People → Invite member → type ben → Role: Member → Send invitation.' }
            ] } },
        { id: 'a1-invite-c', type: 'callout', kind: 'tip', title: 'Check the username', html: 'Ask the person to send you their exact username. Inviting a similar-looking username by mistake gives a stranger a way into your organization.' },
        { id: 'a1-q-invite-blk', type: 'question', q: 'a1-q-invite' }
      ] },
      { id: 'a1-teams', title: 'Teams: grant access to groups', blocks: [
        { id: 'a1-teams-t', type: 'text', html: '<p>Giving every student access to every repository one by one does not scale. A <dfn data-term="team">team</dfn> is a named group of members. You add people to the team and give the <em>team</em> a role on each repository (Read, Triage, Write, Maintain or Admin). When a student joins or leaves the team, their access follows at once.</p><p>Good team names describe a group and a time: <code>thesis-2026</code>, <code>course-web-dev</code>, <code>staff</code>.</p>' },
        { id: 'a1-teams-h', type: 'h', text: 'Nested teams' },
        { id: 'a1-teams-n', type: 'text', html: '<p>A team can have a <b>parent team</b>. A child team inherits the parent\'s repository access, and the parent\'s members can see it. For example <code>course-web-dev</code> can sit under <code>staff</code>: every repository that <code>staff</code> can read, the course team can read too. Only add a person to the most specific team.</p>' },        { id: 'a1-teams-vis', type: 'callout', kind: 'info', title: 'Team visibility and maintainers', html: 'A team is either <b>Visible</b> (all members can see it) or <b>Secret</b> (only its own members and owners). A <b>team maintainer</b> can add and remove people in that team without being an owner, which lets a course teacher manage their own group. This practice copy does not show these two options.' },        { id: 'a1-teams-sim', type: 'interactive', widget: 'github', title: 'Build the thesis team',
          caption: 'Create the team, add Aino and give the team access to her thesis repository.',
          config: {
            start: '/orgs/hamk-projects/teams',
            terminal: false,
            world: world({ members: ['aino', 'ben'], teams: { staff: { name: 'Staff', members: ['teacher'], repos: { 'hamk-projects/course-web-dev': 'write' } } } }),
            tasks: [
              { id: 'team', text: 'Create a team named <b>Thesis 2026</b>', check: function (w) { return !!w.server.orgs['hamk-projects'].teams['thesis-2026']; },
                hint: 'Teams tab, then New team.', solution: 'Teams → New team → name: Thesis 2026 → Create team.' },
              { id: 'member', text: 'Add <code>aino</code> to the team', check: function (w) { var t = w.server.orgs['hamk-projects'].teams['thesis-2026']; return !!t && t.members.indexOf('aino') >= 0; },
                hint: 'Open the team and use the add member list.', solution: 'On the team page choose aino in the Add member list.' },
              { id: 'repo', text: 'Give the team <b>Write</b> on <code>thesis-aino</code>', check: function (w) { var t = w.server.orgs['hamk-projects'].teams['thesis-2026']; return !!t && t.repos['hamk-projects/thesis-aino'] === 'write'; },
                hint: 'Add the repository, then change its role from Read to Write.', solution: 'Add repository thesis-aino, then set its role to Write.' },
              { id: 'nested', text: 'Create a second team <b>Course web dev</b> with the parent team <b>Staff</b>', check: function (w) { var t = w.server.orgs['hamk-projects'].teams['course-web-dev']; return !!t && t.parent === 'staff'; },
                hint: 'The New team form has a Parent team list.', solution: 'New team → name: Course web dev → Parent team: Staff → Create team.' }
            ] } },
        { id: 'a1-teams-c', type: 'callout', kind: 'key', title: 'Grant to teams, not to people', html: 'Whenever the same access is needed by two or more people, use a team. Direct grants to single people are hard to find again when you audit the organization.' },
        { id: 'a1-q-teams-blk', type: 'question', q: 'a1-q-teams' }
      ] },
      { id: 'a1-leave', title: 'When someone leaves', blocks: [
        { id: 'a1-leave-t', type: 'text', html: '<p>Offboarding is a routine owner task. On the <b>People</b> page, the <b>⋯</b> menu next to a member has two choices:</p>' },
        { id: 'a1-leave-l', type: 'list', items: [
          '<b>Remove from organization.</b> The person loses membership, team memberships and access to the private repositories. Use this when they leave the school for good.',
          '<b>Convert to outside collaborator.</b> They stop being a member but keep their direct access to repositories they were added to. Use this when they still need to help with one project, such as a graduate finishing a paper.'
        ] },
        { id: 'a1-leave-c', type: 'callout', kind: 'info', title: 'Their commits stay', html: 'Removing a person does not delete their work. Their commits and the repository history stay and still carry their name. Only their access ends.' },
        { id: 'a1-leave-sim', type: 'interactive', widget: 'github', title: 'Offboard two people',
          caption: 'Ben is graduating but still helps with the thesis project. Clara has left the school.',
          config: {
            start: '/orgs/hamk-projects/people',
            terminal: false,
            world: (function () {
              var w = world({ members: ['aino', 'ben', 'clara'], teams: { 'thesis-2026': { name: 'Thesis 2026', members: ['aino', 'ben', 'clara'], repos: {} } } });
              w.remotes = JSON.parse(JSON.stringify(REPOS));
              w.remotes['hamk-projects/thesis-aino'].collaborators = { ben: 'write' };
              w.remotes['hamk-projects/course-web-dev'].collaborators = { clara: 'write' };
              return w;
            })(),
            tasks: [
              { id: 'outside', text: 'Convert <code>ben</code> to an <b>outside collaborator</b> (he keeps access to the thesis only)',
                check: function (w) { var o = w.server.orgs['hamk-projects']; return o.outside.indexOf('ben') >= 0 && o.members.indexOf('ben') < 0 && w.server.repos['hamk-projects/thesis-aino'].collaborators.ben === 'write'; },
                hint: 'Use the ⋯ menu on Ben\'s row.', solution: 'People → ⋯ next to ben → Convert to outside collaborator.' },
              { id: 'remove', text: 'Remove <code>clara</code> from the organization completely',
                check: function (w) { var o = w.server.orgs['hamk-projects']; return o.members.indexOf('clara') < 0 && o.outside.indexOf('clara') < 0 && !w.server.repos['hamk-projects/course-web-dev'].collaborators.clara; },
                hint: 'The same ⋯ menu has a red option. Confirm the dialog.', solution: 'People → ⋯ next to clara → Remove from organization → confirm.' }
            ] } },
        { id: 'a1-leave-c2', type: 'callout', kind: 'school', title: 'Before a member leaves', html: 'Check that they are not the only person who can administer a repository. Ask them to hand over, or give a teacher Admin, <em>before</em> you remove them. Hand-over is covered in the project lessons.' },
        { id: 'a1-q-leave-blk', type: 'question', q: 'a1-q-leave' }
      ] },
      { id: 'a1-summary', title: 'Summary', blocks: [
        { id: 'a1-sum', type: 'list', items: [
          'Create school projects in the organization so they outlive any single person.',
          'Owners control everything: keep two or three. Members work inside. Outside collaborators reach only the repositories they are added to. Billing managers see payments only.',
          'Invite through <b>People → Invite member</b>; watch <b>Pending invitations</b>.',
          'Create teams for groups, nest them when one group sits inside another, and give the team a role on each repository.',
          'Offboard with <b>Remove from organization</b>, or <b>Convert to outside collaborator</b> when limited access should remain.'
        ] }
      ] }
    ],
    questions: [
      { id: 'a1-q-why', type: 'mc', prompt: 'A student finishes her thesis in a repository under her personal account and then deletes the account. What happens to the repository?',
        options: ['It stays with the school automatically', 'It is deleted or lost with the account', 'It moves to the supervisor', 'It becomes public'], answer: 1, shuffle: false,
        explain: 'A repository belongs to its owner. In the organization the school owns it, so a leaving person cannot take it away.' },
      { id: 'a1-q-roles', type: 'match', prompt: 'Match each person to the right kind of organization access.',
        pairs: [['Teacher who sets up repositories and teams', 'Owner'], ['Student working on a thesis', 'Member'], ['External examiner who reads one thesis', 'Outside collaborator'], ['Finance clerk who pays the invoice', 'Billing manager']],
        explain: 'Give the least access that does the job: only the teacher needs owner rights.' },
      { id: 'a1-q-invite', type: 'mc', prompt: 'Ben accepted nothing yet. Where do you find his invitation?',
        options: ['People → Pending invitations', 'Settings → Audit log only', 'Teams → Thesis 2026', 'Ben\'s personal profile'], answer: 0, shuffle: false,
        hints: ['It is on the same page as the member list.'], explain: 'Until accepted, an invited person is only listed under Pending invitations.' },
      { id: 'a1-q-teams', type: 'mc', prompt: 'Twenty students start the same course. What is the best way to give them Read access to the course repository?',
        options: ['Add each student as a direct collaborator', 'Make all of them owners', 'Put them in a team and give the team Read on the repository', 'Make the repository public'], answer: 2,
        explain: 'A team is granted once, and access follows when people join or leave. Owners would give far too much; public exposes the material to everyone.' },
      { id: 'a1-q-owners', type: 'multi', prompt: 'Which statements about owners are correct?',
        options: ['An owner is administrator of every repository in the organization', 'It is wise to have just one owner so nobody gets confused', 'Students should become owners so they can invite their own friends', 'Two or three owners keep the organization manageable when one is away'], answer: [0, 3],
        explain: 'Owners are powerful, so keep few; but never a single one, or the organization is stuck when that person leaves.' },
      { id: 'a1-q-leave', type: 'mc', prompt: 'A graduate must still finish edits to one repository, but should no longer see other school projects. What do you do?',
        options: ['Remove from organization and nothing else', 'Convert to outside collaborator and keep their access to that repository', 'Make them an owner', 'Give them the staff team'], answer: 1,
        explain: 'An outside collaborator is not a member, but keeps the specific repository access that was granted directly. A full removal would also end that access.' }
    ]
  });
})();
