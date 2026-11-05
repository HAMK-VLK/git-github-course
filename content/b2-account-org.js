/* b2 = Your GitHub account and the school organization (github widget: sign-up, security settings, organization invite). */
(function () {
  var USERS = { teacher: { name: 'Tiina Teacher' }, aino: { name: 'Aino Student' } };

  TDC.registerTopic({
    id: 'b2',
    title: 'Your GitHub account and the school organization',
    subtitle: 'Create a safe, long-lived GitHub account, turn on two-factor login and join the school organization.',
    audience: 'everyone · no experience needed',
    objectives: [
      'explain the difference between a personal account and an organization',
      'create a GitHub account with a lasting email address and a professional username',
      'turn on two-factor authentication and keep your recovery codes safe',
      'accept an invitation to the hamk-projects organization',
      'find your role on the organization People page'
    ],
    glossary: {
      organization: { term: 'organization', def: 'A shared account on GitHub that owns repositories for a group, such as a school or a company. People join it as members; the organization is not a person and has no password.' },
      twofa: { term: 'two-factor authentication (2FA)', def: 'A second proof of identity at sign-in, usually a 6-digit code from an app on your phone, added to your password. A stolen password alone then does not open your account.' },
      owner: { term: 'owner', def: 'An organization role with full control: invite people, change settings and manage every repository. Everyone else in the organization is a <em>member</em>.' }
    },
    commands: [],
    sections: [
      { id: 'b2-kinds', title: 'Personal account vs organization', blocks: [
        { id: 'b2-kinds-t', type: 'text', html: '<p>GitHub is a website where Git repositories are stored and shared. To use it you need <b>your own account</b>: one account per person, with a username that shows next to everything you do (for example <code>aino</code>).</p><p>Schools and companies add an <dfn data-term="organization">organization</dfn> on top. The organization is a shared home for the group\'s projects. You do not make a new account for it: your personal account is invited to <em>join</em> it.</p>' },
        { id: 'b2-kinds-tbl', type: 'table', head: ['', 'Personal account', 'Organization'], rows: [
          ['Who is it?', 'One real person', 'A group, such as <code>hamk-projects</code>'],
          ['Can you sign in to it?', 'Yes', 'No: you sign in as yourself and work inside it'],
          ['Who controls it?', 'You', 'Its <dfn data-term="owner">owners</dfn> (here: the teacher)'],
          ['Typical content', 'Your own experiments', 'Course projects, theses, shared material']
        ] },
        { id: 'b2-kinds-c', type: 'callout', kind: 'school', title: 'In this course', html: 'The fictional organization <b>HAMK Projects</b> (<code>hamk-projects</code>) holds the thesis and project repositories. Aino, Ben and the teacher each have a personal account and belong to the organization.' },
        { id: 'b2-q-kinds-blk', type: 'question', q: 'b2-q-kinds' }
      ] },
      { id: 'b2-signup', title: 'Create the account', blocks: [
        { id: 'b2-signup-t', type: 'text', html: '<p>Two choices matter more than they seem, because both are hard to change later.</p>' },
        { id: 'b2-signup-l', type: 'list', items: [
          '<b>Email.</b> Use a <em>personal</em> address that will still work after you graduate or leave your job (for example a private mail account). Then add your school address too under <b>Settings → Emails</b>, so the school can recognise you. If the account is tied only to the school email, you can lose it when the school email is closed.',          '<b>Username.</b> It appears in every repository link and commit, and employers will see it. Choose something professional, such as your name: <code>aino-virtanen</code>, not <code>xXcoolgamerXx</code>. Letters, numbers and single hyphens only.',
          '<b>Password.</b> Long beats clever: a sentence of several words, unique to GitHub, ideally stored in a password manager.'
        ] },
        { id: 'b2-signup-sim', type: 'interactive', widget: 'github', title: 'Sign up for GitHub',
          caption: 'This is a practice copy of github.com: nothing is sent anywhere. Use any made-up email and password.',
          config: {
            start: '/signup', terminal: false,
            world: { me: 'visitor', myName: 'Visitor', run: [] },
            tasks: [
              { id: 'signup', text: 'Fill in the form with an email, a password (at least 8 characters with a number) and the username <code>aino-student</code>, then continue',
                check: function (w) { return w.did('signup'); },
                hint: 'Usernames use letters, numbers and hyphens. The email needs an @.', solution: 'Email: aino@example.com, password: a sentence of 15+ letters or 8+ with a number, username: aino-student.' }
            ] } },
        { id: 'b2-signup-c', type: 'callout', kind: 'warn', title: 'Never share your account', html: 'One account is one person. Do not lend your login to a friend or share one account in a group: every change would carry your name, and a leak would be your problem. To work together, each person gets their own account and is added to the project.' },
        { id: 'b2-q-signup-blk', type: 'question', q: 'b2-q-email' }
      ] },
      { id: 'b2-2fa', title: 'Secure it: two-factor login', blocks: [
        { id: 'b2-2fa-t', type: 'text', html: '<p>Passwords leak. <dfn data-term="twofa">Two-factor authentication</dfn> (2FA) adds a second check: after your password, GitHub asks for a 6-digit code that changes every 30 seconds and lives in an authenticator app on your phone. Many organizations, including schools, require it.</p>' },
        { id: 'b2-2fa-l', type: 'list', steps: true, items: [
          'Install an authenticator app on your phone (any app that supports one-time codes).',
          'On GitHub open <b>Settings → Password and authentication</b> and choose to enable two-factor authentication.',          'Scan the QR code with the app, then type the 6-digit code it shows.',
          '<b>Download and store your recovery codes.</b> They are the only way back in if you lose your phone.'
        ] },
        { id: 'b2-2fa-sim', type: 'interactive', widget: 'github', title: 'Turn on two-factor authentication',
          caption: 'You are signed in as aino and the security settings are open. Any 6 digits work as the code.',
          config: {
            start: '/settings/security', terminal: false,
            world: { me: 'aino', myName: 'Aino Student', users: USERS, run: [] },
            tasks: [
              { id: 'twofa', text: 'Enable two-factor authentication and confirm that you saved the recovery codes',
                check: function (w) { return !!w.server.users.aino.twofa; },
                hint: 'Press the enable button, type any 6 digits, then finish the recovery-codes step.', solution: 'Enable two-factor authentication, enter 123456, then confirm the recovery codes.' }
            ] } },
        { id: 'b2-2fa-c', type: 'callout', kind: 'key', title: 'Recovery codes are your spare key', html: 'Save them outside the phone: in a password manager or printed and kept somewhere safe. Never post them or email them to anyone, not even to a teacher or "GitHub support".' },
        { id: 'b2-q-2fa-blk', type: 'question', q: 'b2-q-2fa' }
      ] },
      { id: 'b2-join', title: 'Join hamk-projects', blocks: [
        { id: 'b2-join-t', type: 'text', html: '<p>Nobody can add themselves to an organization. An <dfn data-term="owner">owner</dfn> sends an <b>invitation</b>; you get an email and a notification on GitHub, and you accept it. Until you accept, you are not a member and cannot see the private repositories.</p>' },
        { id: 'b2-join-sim', type: 'interactive', widget: 'github', title: 'Accept the invitation',
          caption: 'The teacher has already invited you (aino). Look for the dot on the bell icon.',
          config: {
            start: '/', terminal: false,
            world: { me: 'aino', myName: 'Aino Student', users: USERS, run: [],
              orgs: { 'hamk-projects': { displayName: 'HAMK Projects', owners: ['teacher'], members: [], invites: [{ login: 'aino', role: 'member' }] } } },
            tasks: [
              { id: 'bell', text: 'Open the notifications bell (🔔) at the top right', check: function (w) { return w.did('click', function (e) { return e.id === 'notifications'; }); }, solution: 'Click the bell icon.' },
              { id: 'join', text: 'Join <b>HAMK Projects</b>', check: function (w) { return w.server.orgs['hamk-projects'].members.indexOf('aino') >= 0; },
                hint: 'The bell opens the invitation page.', solution: 'Click the bell, then the green Join HAMK Projects button.' },
              { id: 'people', text: 'Open the organization\'s <b>People</b> page and find your role',
                check: function (w) { return w.did('visit', function (e) { return /\/orgs\/hamk-projects\/people/.test(e.path); }); },
                hint: 'After joining you land on the organization page; look for People.', solution: 'Open the People tab and find aino in the list: the label says Member.' }
            ] } },
        { id: 'b2-join-c', type: 'callout', kind: 'tip', title: 'No dot on the bell?', html: 'Invitations also arrive by email, and the link in the email opens the same Join page. Check that you are signed in with the account the teacher invited.' },
        { id: 'b2-q-join-blk', type: 'question', q: 'b2-q-join' }
      ] },
      { id: 'b2-members', title: 'What members see', blocks: [
        { id: 'b2-members-t', type: 'text', html: '<p>The organization\'s <b>People</b> page lists everyone and their role. There are two roles: <b>Owner</b> (full control) and <b>Member</b> (a normal participant). As a member you can see the other members and the repositories you have been given access to. You do not see the owners\' settings, and you cannot invite people.</p><p>What you can do <em>inside</em> a repository is a separate matter: that is set per repository (read, write, admin) and is covered in a later lesson.</p>' },
        { id: 'b2-members-c', type: 'callout', kind: 'info', title: 'The 2FA mark', html: 'On the People page owners can see who has two-factor authentication on. Organizations can make it mandatory; members without it then keep their place but cannot reach the organization resources until they turn it on.' },
        { id: 'b2-q-role-blk', type: 'question', q: 'b2-q-role' }
      ] },
      { id: 'b2-summary', title: 'Summary', blocks: [
        { id: 'b2-sum', type: 'list', items: [
          'A personal account is one person; an organization is a shared home for a group that you are invited to join.',
          'Sign up with a personal email that outlives your studies, add your school email, and pick a professional username.',
          'Turn on 2FA and store the recovery codes safely, away from your phone.',
          'Never share your account or your codes: everyone gets their own account.',
          'Accept the invitation through the bell or your email, then check your role on the organization\'s People page.'
        ] }
      ] }
    ],
    questions: [
      { id: 'b2-q-kinds', type: 'mc', prompt: 'What is the organization <code>hamk-projects</code>?',
        options: ['A shared home for the school\'s projects that personal accounts join', 'A second password for your account', 'A person who teaches the course', 'A program you install on your computer'], answer: 0, shuffle: false,
        explain: 'An organization is a group account. You sign in as yourself and become a member of it.' },
      { id: 'b2-q-email', type: 'mc', prompt: 'Which email setup is wisest for a new GitHub account?',
        options: ['Only the school email', 'A personal email that lasts, plus the school email added', 'A made-up address nobody can read', 'The teacher\'s email'], answer: 1, shuffle: false,
        hints: ['What happens to the school email when you graduate?'],
        explain: 'A lasting personal email keeps the account yours for years, and the added school email lets the school recognise you.' },
      { id: 'b2-q-2fa', type: 'multi', prompt: 'Which of these are good habits with two-factor authentication?',
        options: ['Store the recovery codes in a password manager', 'Email the recovery codes to a friend as a backup', 'Use an authenticator app for the 6-digit code', 'Share the codes with the teacher so they can help'], answer: [0, 2],
        explain: 'Recovery codes are a private spare key. Nobody else should ever have them.' },
      { id: 'b2-q-user', type: 'mc', prompt: 'Which username is the best choice for a GitHub account you will use at work?',
        options: ['xXcoolgamerXx', 'aino-virtanen', 'password123', 'asdf'], answer: 1, shuffle: false,
        explain: 'The username appears in links and commits that others see, so a professional, recognisable name serves you best.' },
      { id: 'b2-q-join', type: 'order', prompt: 'Put the steps of joining an organization in order.',
        items: ['An owner invites your username', 'You notice the invitation (bell or email)', 'You click Join', 'You appear on the People page as a member'],
        explain: 'Only an owner can invite; nobody can join on their own.' },
      { id: 'b2-q-role', type: 'mc', prompt: 'You joined <code>hamk-projects</code> by invitation as a normal participant. Which role do you have?',
        options: ['Owner', 'Member', 'Outside visitor', 'Administrator of GitHub'], answer: 1, shuffle: false,
        explain: 'People who are not owners are members. The People page shows the role next to your name.' }
    ]
  });
})();
