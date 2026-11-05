/* e5 = Running the school organization (4.5). github widget as it-admin: member privileges, 2FA, offboarding, outside collaborators, audit log.
 * Org-wide rulesets, templates, backups and security features are explained only (the simulator has no such pages). */
TDC.registerTopic({
  id: 'e5',
  title: 'Running the school organization',
  subtitle: 'The settings and routines that keep a shared school GitHub organization safe, tidy and handed over properly.',
  audience: 'organization owners and IT administrators · after the permissions lessons',
  objectives: [
    'set the base permission and member privileges to match a school policy',
    'require two-factor authentication for everyone in the organization',
    'offboard a departed member so the work stays and the access ends',
    'review outside collaborators and read the audit log',
    'name the org-wide tools (rulesets, templates, backups, security features) and which plans they need'
  ],
  glossary: {
    basepermission: { term: 'base permission', def: 'The access level every organization member gets on every repository, before teams or direct access add more. For example Read or No permission.' },
    auditlog: { term: 'audit log', def: 'A record of who changed what in an organization: invitations, setting changes, repository deletions, and so on. Only owners can read it.' },
    outsidecollab: { term: 'outside collaborator', def: 'A person who can reach one or more repositories of the organization but is not a member of it, for example an external examiner.' },
    twofa: { term: 'two-factor authentication (2FA)', def: 'A second proof of identity at sign-in, such as a code from an app, in addition to the password.' }
  },
  commands: [],
  sections: [
    { id: 'e5-role', title: 'What an organization owner does', blocks: [
      { id: 'e5-t1', type: 'text', html: '<p>A school organization lasts longer than any student. Owners decide <b>who is inside</b>, <b>what members may do by themselves</b> and <b>what happens when someone leaves</b>. This lesson is about those decisions, not about everyday Git.</p>' },
      { id: 'e5-t2', type: 'list', items: [
        '<b>Policy</b>: the defaults that apply to everyone (base permission, who may create or delete repositories).',
        '<b>People</b>: onboarding, offboarding, outside collaborators.',
        '<b>Safety</b>: two-factor authentication, rules on important branches, the audit log.'] },
      { id: 'e5-c1', type: 'callout', kind: 'staff', title: 'Keep at least two owners', html: 'One owner who leaves or loses their phone can lock the school out of its own projects. Keep two or three owners (for example IT and a teacher), and give every other person the smallest role that lets them work.' },
      { id: 'e5-q1', type: 'question', q: 'e5-q-owners' }
    ] },
    { id: 'e5-priv', title: 'Member privileges: the school policy in a few switches', blocks: [
      { id: 'e5-t3', type: 'text', html: '<p>As an owner, open the organization, then <b>Settings → Member privileges</b>. These switches apply to every member at once, so they are the strongest tool you have.</p>' },      { id: 'e5-tbl1', type: 'table', head: ['Setting', 'What it controls', 'Suggested school policy'], compact: true,
        rows: [['<b>Base permissions</b>', 'Access every member gets on every repository', '<b>No permission</b> or <b>Read</b>. Give Write through teams. Never Write or Admin for everybody.'],
               ['<b>Repository creation</b>', 'Whether members may create private or public repositories', 'Private on. Public off (an owner decides what becomes public).'],
               ['<b>Repository forking</b>', 'Forking private repositories into personal accounts', 'Off. A fork outside the organization escapes your rules.'],
               ['<b>Allow members to change repository visibilities</b>', 'Making a repository public or private', 'Off. Only owners decide.'],
               ['<b>Allow members to delete or transfer repositories</b>', 'The Danger Zone for repository admins', 'Off. A repository admin could otherwise delete a thesis or take it away.']] },
      { id: 'e5-c2', type: 'callout', kind: 'key', title: 'Key idea', html: 'Base permission is a <b>floor</b>, not a limit. Teams and direct access can only add to it. If the base is <b>Write</b>, you cannot take Write away from one student on one repository, and every member can push to every repository.' },
      { id: 'e5-q2', type: 'question', q: 'e5-q-base' },
      { id: 'e5-ex1', type: 'interactive', widget: 'github', title: 'Lock down the organization defaults',
        caption: 'You are signed in as <b>it-admin</b>. The organization is too open: every member has Write everywhere and can delete repositories. Change the settings to the policy above.',
        config: {
          start: '/orgs/hamk-projects/settings/privileges', personas: ['it-admin', 'aino'],
          world: {
            me: 'it-admin', myName: 'IT Administrator',
            users: { 'it-admin': { name: 'IT Administrator' }, teacher: { name: 'Tiina Teacher' }, aino: { name: 'Aino Student' }, ben: { name: 'Ben Opiskelija' }, maija: { name: 'Maija Valmistunut' }, 'external-examiner': { name: 'External Examiner' } },
            orgs: { 'hamk-projects': { displayName: 'HAMK Projects', owners: ['it-admin', 'teacher'], members: ['aino', 'ben', 'maija'], outside: ['external-examiner'],
              settings: { basePermission: 'write', membersCanDelete: true, membersCanChangeVisibility: true, membersCanCreate: true, membersCanFork: true, require2fa: false },
              teams: { 'thesis-2026': { name: 'Thesis 2026', members: ['aino', 'ben'], repos: { 'hamk-projects/thesis-aino': 'write' } } } } },
            remotes: {
              'hamk-projects/thesis-aino': { visibility: 'private', description: 'Bachelor thesis', collaborators: { 'external-examiner': 'read' },
                commits: [{ msg: 'Initial commit', author: 'teacher', files: { 'README.md': '# Thesis: Aino Student\n' } }] },
              'hamk-projects/thesis-maija': { visibility: 'private', description: 'Bachelor thesis (graduated)', collaborators: { maija: 'admin' },
                commits: [{ msg: 'Initial commit', author: 'maija', files: { 'README.md': '# Thesis: Maija\n' } }] }
            },
            run: [] },
          tasks: [
            { id: 'base', text: 'Set <b>Base permissions</b> to <b>No permission</b>', hint: 'Settings → Member privileges, the first section.', solution: 'Member privileges → Base permissions → No permission',
              check: function (w) { return w.server.orgs['hamk-projects'].settings.basePermission === 'none'; } },
            { id: 'delete', text: 'Switch off <b>Allow members to delete or transfer repositories</b>', hint: 'Look under Admin repository permissions.', solution: 'Member privileges → Admin repository permissions → untick the delete or transfer box',
              check: function (w) { return w.server.orgs['hamk-projects'].settings.membersCanDelete === false; } },
            { id: 'vis', text: 'Also switch off members changing repository visibility', hint: 'Same section as the previous task.', solution: 'Member privileges → Admin repository permissions → untick the visibility box',
              check: function (w) { return w.server.orgs['hamk-projects'].settings.membersCanChangeVisibility === false; } }
          ] } },
      { id: 'e5-w1', type: 'callout', kind: 'warn', title: 'Common mistake', html: 'Lowering the base permission is not retroactive magic: people keep the access they get from teams or direct invitations. After you change it, check that each team still has what it needs. Try the <b>aino</b> button under the simulator: Aino keeps Write on her own thesis through the team.' }
    ] },
    { id: 'e5-2fa', title: 'Require two-factor authentication', blocks: [
      { id: 'e5-t4', type: 'text', html: '<p>A stolen password should not be enough to reach a thesis or exam material. With <dfn data-term="twofa">two-factor authentication</dfn> the attacker also needs the person’s phone or security key. You can <b>require</b> it for the whole organization under <b>Settings → Authentication security</b>.</p>' },      { id: 'e5-t5', type: 'text', html: '<p>What happens when you switch it on: members and billing managers who have no 2FA yet keep their place but <b>cannot reach the organization\'s resources</b> until they turn it on. Outside collaborators without 2FA are <b>removed</b>; if they turn on 2FA within three months you can reinstate them.</p>' },
      { id: 'e5-c3', type: 'callout', kind: 'staff', title: 'Announce it first', html: 'Send a message a week ahead: "From Monday, turn on 2FA on your GitHub account (Settings → Password and authentication). Otherwise you lose access to the organization." The simulator lists members without 2FA on the same page so you know who would be affected.' },
      { id: 'e5-q3', type: 'question', q: 'e5-q-2fa' },
      { id: 'e5-ex2', type: 'interactive', widget: 'github', title: 'Require 2FA for the organization',
        caption: 'Open the security page, read who has no 2FA, then require it.',
        config: {
          start: '/orgs/hamk-projects/settings/privileges', personas: ['it-admin'],
          world: {
            me: 'it-admin', myName: 'IT Administrator',
            users: { 'it-admin': { name: 'IT Administrator', twofa: true }, teacher: { name: 'Tiina Teacher', twofa: true }, aino: { name: 'Aino Student', twofa: true }, ben: { name: 'Ben Opiskelija' } },
            orgs: { 'hamk-projects': { displayName: 'HAMK Projects', owners: ['it-admin', 'teacher'], members: ['aino', 'ben'] } },
            remotes: {}, run: [] },
          tasks: [
            { id: 'look', text: 'Open <b>Authentication security</b>', check: function (w) { return w.did('visit', function (e) { return /settings\/security$/.test(e.path); }); } },
            { id: 'req', text: 'Tick <b>Require two-factor authentication</b>', hint: 'One checkbox on that page.', solution: 'Settings → Authentication security → tick Require two-factor authentication',
              check: function (w) { return w.server.orgs['hamk-projects'].settings.require2fa === true; } },
            { id: 'blocked', text: 'Open <b>People</b>: Ben (no 2FA) is still a member, but cannot reach the organization’s repositories until he turns 2FA on', hint: 'People is in the organization’s top tabs.',
              check: function (w) { var o = w.server.orgs['hamk-projects']; return o.settings.require2fa === true && o.members.indexOf('ben') >= 0 && w.did('visit', function (e) { return /\/people$/.test(e.path); }); } }
          ] } }
    ] },
    { id: 'e5-off', title: 'Onboarding and offboarding', blocks: [
      { id: 'e5-t6', type: 'text', html: '<p>People arrive and leave every term. A fixed routine stops two problems: new people waiting for access, and old people keeping it.</p>' },
      { id: 'e5-h1', type: 'h', text: 'Onboarding checklist' },
      { id: 'e5-l1', type: 'list', ordered: true, items: [
        'Invite the person with their GitHub username (<b>People → Invite member</b>), role <b>Member</b>.',
        'Add them to the right team (for example <em>Thesis 2026</em>), never directly to many repositories.',
        'Ask them to turn on 2FA.',
        'Point them to the repository README and the course rules.'] },
      { id: 'e5-h2', type: 'h', text: 'Offboarding checklist' },
      { id: 'e5-l2', type: 'list', ordered: true, items: [
        '<b>Before</b> they go: make sure the work lives in a repository the organization owns, with an owner or teacher who has Admin. Move any repository from a personal account into the organization.',
        'Merge or hand over open pull requests; reassign issues.',
        'Remove the person: <b>People → ⋯ → Remove from organization</b>.',
        'Check <b>Outside collaborators</b> and repositories for leftover direct access.',
        'Look in the audit log to confirm.'] },
      { id: 'e5-c4', type: 'callout', kind: 'key', title: 'Key idea', html: 'Removing a member removes <b>people</b>, not <b>work</b>. The repositories belong to the organization, so they stay. The danger is work in a personal account: removing the person then changes nothing, and the school never owned it.' },
      { id: 'e5-q4', type: 'question', q: 'e5-q-offboard' },
      { id: 'e5-ex3', type: 'interactive', widget: 'github', title: 'Offboard Maija, who graduated',
        caption: 'Maija finished her thesis. Remove her from the organization, keep her repository, then check the audit log. You can use the <b>aino</b> button to see that members cannot do this.',
        config: {
          start: '/orgs/hamk-projects/people', personas: ['it-admin', 'aino'],
          world: {
            me: 'it-admin', myName: 'IT Administrator',
            users: { 'it-admin': { name: 'IT Administrator' }, teacher: { name: 'Tiina Teacher' }, aino: { name: 'Aino Student' }, maija: { name: 'Maija Valmistunut' }, 'external-examiner': { name: 'External Examiner' } },
            orgs: { 'hamk-projects': { displayName: 'HAMK Projects', owners: ['it-admin', 'teacher'], members: ['aino', 'maija'], outside: ['external-examiner'],
              teams: { 'thesis-2026': { name: 'Thesis 2026', members: ['aino', 'maija'], repos: {} } } } },
            remotes: {
              'hamk-projects/thesis-maija': { visibility: 'private', description: 'Bachelor thesis (graduated)', collaborators: { maija: 'admin', 'external-examiner': 'read' },
                commits: [{ msg: 'Initial commit', author: 'maija', files: { 'README.md': '# Thesis: Maija\n' } }, { msg: 'Final version', author: 'maija', files: { 'thesis.md': 'Final.\n' } }] }
            },
            run: [] },
          tasks: [
            { id: 'remove', text: 'Remove <b>maija</b> from the organization', hint: 'People → the ⋯ menu on her row.', solution: 'People → ⋯ next to maija → Remove from organization',
              check: function (w) { var o = w.server.orgs['hamk-projects']; return o.members.indexOf('maija') < 0 && o.owners.indexOf('maija') < 0 && !w.server.repos['hamk-projects/thesis-maija'].collaborators.maija; } },
            { id: 'kept', text: 'Confirm her repository <code>thesis-maija</code> is still there: open it', hint: 'The organization page lists its repositories.', solution: 'Organization page → Repositories → thesis-maija',
              check: function (w) { return !!w.server.repos['hamk-projects/thesis-maija'] && w.server.orgs['hamk-projects'].members.indexOf('maija') < 0 && w.did('visit', function (e) { return /\/hamk-projects\/thesis-maija/.test(e.path); }); } },
            { id: 'audit', text: 'Read the <b>Audit log</b> entry for the removal', hint: 'Organization Settings → Audit log (after you removed Maija).', solution: 'Open /orgs/hamk-projects/settings/audit',
              check: function (w) { var o = w.server.orgs['hamk-projects']; return w.did('visit', function (e) { return /settings\/audit$/.test(e.path); }) && o.audit.some(function (a) { return /remove_member maija/.test(a.text); }); } }
          ] } },
      { id: 'e5-c5', type: 'callout', kind: 'info', title: 'What the simulator does', html: 'In real GitHub a removed member also loses access to their own private forks of organization repositories, and GitHub keeps their data for three months so you can reinstate them. The simulator only models access and the log.' }
    ] },
    { id: 'e5-outside', title: 'Outside collaborators and the audit log', blocks: [
      { id: 'e5-t7', type: 'text', html: '<p>An <dfn data-term="outsidecollab">outside collaborator</dfn> is useful: an external examiner or a company partner can read one thesis without joining the whole school. But the access stays until somebody removes it, so review the list every term: <b>People → Outside collaborators</b>.</p>' },
      { id: 'e5-t8', type: 'text', html: '<p>The <dfn data-term="auditlog">audit log</dfn> answers "who changed this, and when?" It records invitations, role changes, setting changes, repository deletions and transfers. Use it after an incident, and to check your own work.</p>' },
      { id: 'e5-c6', type: 'callout', kind: 'info', title: 'Good to know', html: 'On GitHub the log keeps only recent events (about 180 days), so export it (JSON or CSV) if you must keep it longer.' },
      { id: 'e5-q5', type: 'question', q: 'e5-q-outside' },
      { id: 'e5-ex4', type: 'interactive', widget: 'github', title: 'Review outside collaborators',
        caption: 'The external examiner finished marking last term. Find the list of outside collaborators and remove the examiner.',
        config: {
          start: '/orgs/hamk-projects', personas: ['it-admin'],
          world: {
            me: 'it-admin', myName: 'IT Administrator',
            users: { 'it-admin': { name: 'IT Administrator' }, teacher: { name: 'Tiina Teacher' }, aino: { name: 'Aino Student' }, 'external-examiner': { name: 'External Examiner' } },
            orgs: { 'hamk-projects': { displayName: 'HAMK Projects', owners: ['it-admin', 'teacher'], members: ['aino'], outside: ['external-examiner'] } },
            remotes: { 'hamk-projects/thesis-aino': { visibility: 'private', description: 'Bachelor thesis', collaborators: { 'external-examiner': 'read' },
              commits: [{ msg: 'Initial commit', author: 'teacher', files: { 'README.md': '# Thesis\n' } }] } },
            run: [] },
          tasks: [
            { id: 'open', text: 'Open <b>People</b> and its <b>Outside collaborators</b> tab', hint: 'The People tab of the organization page.', check: function (w) { return w.did('visit', function (e) { return /\/people$/.test(e.path); }); } },
            { id: 'rm', text: 'Remove <b>external-examiner</b>', hint: 'Use the red button in that row.', solution: 'People → Outside collaborators → Remove all access → confirm',
              check: function (w) { var o = w.server.orgs['hamk-projects']; return o.outside.indexOf('external-examiner') < 0 && !w.server.repos['hamk-projects/thesis-aino'].collaborators['external-examiner']; } }
          ] } }
    ] },
    { id: 'e5-more', title: 'Org-wide tools: rules, templates, backups, security', blocks: [
      { id: 'e5-t9', type: 'text', html: '<p>The simulator covers the settings above. These tools exist on real GitHub too. Some depend on the plan of your organization, so check what HAMK has before promising them.</p>' },
      { id: 'e5-tbl2', type: 'table', head: ['Tool', 'Use it for', 'Plan'], compact: true,
        rows: [['<b>Organization rulesets</b>', 'One rule set (pull request and approval needed, no force-push) that covers many repositories at once', 'Needs a paid plan (Team or higher). Rulesets on a single repository work on every plan for public repositories; private ones need a paid plan'],               ['<b>Template repositories</b>', 'Every new thesis starts with the same README, <code>.gitignore</code>, issue templates and rules; one tick, <b>Template repository</b>, in the repository settings', 'All plans'],
               ['<b>Naming policy</b>', 'Agree names such as <code>thesis-2026-aino</code> or <code>course-gitbasics-2026</code> so old projects are findable. GitHub does not enforce it; write it in your onboarding page', '-'],
               ['<b>Backups and export</b>', 'Git is already a copy: every clone is a full backup of the code. Issues, pull requests and settings are not in a clone; use GitHub’s export tools or a scheduled backup tool', '-'],
               ['<b>Dependabot alerts, secret scanning, security overview</b>', 'Warn about vulnerable libraries and passwords committed by mistake; overview shows risk across the organization', 'Dependabot alerts are free. Secret scanning is free for public repositories; for private repositories it needs a paid add-on (GitHub Secret Protection / Code Security)'] ] },
      { id: 'e5-c7', type: 'callout', kind: 'school', title: 'At HAMK', html: 'Ask which plan the school organization has (Free, Team or Education benefits) before you design a policy that depends on org-wide rulesets or private-repository security scanning.' },
      { id: 'e5-q6', type: 'question', q: 'e5-q-tools' }
    ] },
    { id: 'e5-summary', title: 'Summary', blocks: [
      { id: 'e5-sum', type: 'list', items: [
        'Keep two or three owners; everyone else gets the smallest role that works.',
        'Set the base permission to <b>No permission</b> or <b>Read</b>; give Write through teams.',
        'Switch off member delete/transfer and visibility changes so only owners decide.',
        'Require 2FA; announce it first.',
        'Offboard by removing the member: the repositories stay, the access goes. Move the work into the organization <em>before</em> they leave.',
        'Review outside collaborators every term and use the audit log to check changes.',
        'Org rulesets and security scanning depend on the plan.'] }
    ] }
  ],
  questions: [
    { id: 'e5-q-owners', type: 'mc', prompt: 'The only owner of the organization leaves HAMK and their account is closed. What is the main risk?',
      options: ['Nobody can change settings, manage people or recover repositories', 'All repositories become public', 'The repositories are deleted at once'],
      answer: 0, hints: ['Think about who can open Settings.'], explain: 'Without an owner, nobody can manage members or settings. Keep several owners. Repositories are not made public or deleted automatically.' },
    { id: 'e5-q-base', type: 'mc', prompt: 'The base permission is <b>Write</b>. Ben is a member with no team. What can he do?',
      options: ['Push to every repository in the organization', 'Nothing until a teacher adds him to a team', 'Only read the repositories'],
      answer: 0, hints: ['Base permission applies to all members on all repositories.'], explain: 'The base permission is given to every member on every repository. With Write, Ben can push everywhere. Set it to No permission or Read and add Write through teams.' },
    { id: 'e5-q-2fa', type: 'mc', prompt: 'You switch on "Require two-factor authentication". Ben has not set up 2FA. What happens to him?',
      options: ['He keeps his membership but cannot reach the organization\'s resources until he turns on 2FA', 'He can keep working for 30 days', 'Nothing, the rule only applies to new members'],
      answer: 0, hints: ['The rule is enforced for existing members.'], explain: 'Members without 2FA stay in the organization but are blocked from its resources until they enable 2FA (outside collaborators without 2FA are removed), so announce the change first.' },
    { id: 'e5-q-offboard', type: 'order', prompt: 'Put the offboarding of a graduating student in a sensible order.',
      items: ['Make sure the thesis repository belongs to the organization and has an owner', 'Hand over open pull requests and issues', 'Remove the person from the organization', 'Check the audit log and the outside collaborators list'], explain: 'Secure the work first, then remove the person, then verify. Removing first leaves work stranded.' },
    { id: 'e5-q-outside', type: 'multi', prompt: 'Which statements about an <b>outside collaborator</b> are true?',
      options: ['They can have access to one repository without being a member', 'Their access ends automatically after the semester', 'Owners should review them regularly', 'They are listed under People → Outside collaborators'],
      answer: [0, 2, 3], hints: ['Does GitHub have a built-in expiry?'], explain: 'Access has no automatic expiry; someone must remove it, which is why a regular review matters.' },
    { id: 'e5-q-tools', type: 'match', prompt: 'Match the need to the tool.',
      pairs: [['Every new thesis starts with the same files', 'Template repository'], ['Same pull request rule on many repositories', 'Organization ruleset'], ['Who removed a member last week?', 'Audit log'], ['A password was committed by mistake', 'Secret scanning']], explain: 'Templates standardise new repositories, rulesets standardise rules, the audit log records changes, secret scanning finds leaked credentials.' }
  ]
});
