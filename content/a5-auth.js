/* a5 = Signing in securely: 2FA, SSH keys and tokens (terminal + github.com settings). */
(function () {
  var CFG = { 'user.name': 'Aino Student', 'user.email': 'aino@example.com', 'init.defaultBranch': 'main' };
  var ORGS = { 'hamk-projects': { displayName: 'HAMK Projects', owners: ['teacher'], members: ['aino'] } };
  var REMOTES = { 'hamk-projects/course-notes': { description: 'Shared course notes', collaborators: { aino: 'write' },
    commits: [{ msg: 'Initial commit', author: 'teacher', files: { 'README.md': '# Course notes\n' } }] },
    'hamk-projects/thesis-aino': { description: 'Bachelor thesis', collaborators: { aino: 'write' },
    commits: [{ msg: 'Initial commit', author: 'teacher', files: { 'README.md': '# Thesis\n' } }] } };
  function world(extra) {
    var w = { me: 'aino', myName: 'Aino Student', config: CFG, orgs: ORGS, remotes: REMOTES, cwd: '~', users: { teacher: { name: 'Tiina Teacher' } } };
    for (var k in extra) w[k] = extra[k];
    return w;
  }
  function failed(w, re) { return w.log.some(function (l) { return l.code && re.test(l.cmd); }); }
  function me(w) { return w.server.users.aino; }

  TDC.registerTopic({
    id: 'a5',
    title: 'Signing in securely: 2FA, SSH keys and tokens',
    subtitle: 'How Git proves who you are, and how to keep that proof safe.',
    audience: 'everyone who pushes to GitHub · after the basics',
    objectives: [
      'explain why your account password does not work for Git commands over HTTPS',
      'create an SSH key pair, tell the public from the private key, and add the public key to GitHub',
      'test an SSH connection with ssh -T and clone with an SSH address',
      'create a fine-grained personal access token with an expiry date and access to one repository',
      'turn on two-factor authentication and keep recovery codes safe',
      'react correctly when a password, key or token leaks'
    ],
    glossary: {
      ssh: { term: 'SSH', def: 'A secure way for two computers to talk. Git can use it instead of HTTPS, with a key pair instead of a password.' },
      sshkey: { term: 'SSH key pair', def: 'Two linked files: a <b>private key</b> that stays on your computer and a <b>public key</b> that you give to GitHub. GitHub can check that you hold the private key without ever seeing it.' },
      pat: { term: 'personal access token', def: 'A long random string that works like a password for one purpose. You choose which repositories it may reach, what it may do and when it expires. A <b>fine-grained</b> token is the more precise, recommended kind.' },
      secret: { term: 'secret', def: 'Anything that proves who you are: a password, token, private key or recovery code. Never put one in a repository, e-mail or chat.' }
    },
    commands: [
      { cmd: 'ssh-keygen -t ed25519 -C "you@example.com"', does: 'Create an SSH key pair (private and public file in ~/.ssh)' },
      { cmd: 'cat ~/.ssh/id_ed25519.pub', does: 'Show the public key so you can paste it into GitHub' },
      { cmd: 'ssh -T git@github.com', does: 'Test that GitHub accepts your SSH key' },
      { cmd: 'git clone git@github.com:<owner>/<repo>.git', does: 'Clone over SSH instead of HTTPS' },
      { cmd: 'git remote set-url origin <url>', does: 'Switch an existing repository between HTTPS and SSH' }
    ],
    sections: [
      { id: 'a5-why', title: 'Why a password is not enough', blocks: [
        { id: 'a5-why-t', type: 'text', html: '<p>Every push says "this commit comes from Aino". GitHub must be sure it really is Aino. Your account password is the weakest proof: it can be guessed, reused on another site or stolen. So GitHub stopped accepting it for Git commands over HTTPS. You have three better ways to prove who you are:</p>' },
        { id: 'a5-why-tab', type: 'table', head: ['Method', 'What you use', 'Good for'],
          rows: [
            ['Browser sign-in (<dfn data-term="gcm">Git Credential Manager</dfn>)', 'A sign-in window, then the tool remembers you', 'Most people on HTTPS. Nothing to set up, and it works with 2FA.'],
            ['<dfn data-term="sshkey">SSH key</dfn>', 'A key pair on your computer', 'Daily work on your own computer, no sign-in windows.'],
            ['<dfn data-term="pat">Personal access token</dfn>', 'A long random string used like a password', 'Scripts, servers and tools that cannot open a browser.']
          ] },
        { id: 'a5-why-c', type: 'callout', kind: 'key', title: 'Same rule for all three', html: 'Whatever proves who you are is a <dfn data-term="secret">secret</dfn>. Share the repository, never the proof. Everyone uses their own account, even in a team project: shared accounts hide who did what and cannot be switched off for one person when they leave.' },
        { id: 'a5-q-pw-blk', type: 'question', q: 'a5-q-pw' }
      ] },
      { id: 'a5-2fa', title: 'Two-factor authentication and recovery codes', blocks: [
        { id: 'a5-2fa-t', type: 'text', html: '<p><dfn data-term="twofa">Two-factor authentication</dfn> (2FA) protects the account itself. You switch it on once under <b>Settings → Password and authentication</b> (you did this in lesson 1.2). Two details matter later:</p>' },
        { id: 'a5-2fa-l', type: 'list', items: [
          '<b>Recovery codes.</b> GitHub shows them once when you enable 2FA. If you lose your phone they are the way back in. Save them in a password manager or print them; do not keep them on the phone itself.',
          '<b>2FA does not replace the Git password.</b> After 2FA, the sign-in window, an SSH key or a token still does the actual work for Git. Your 6-digit code is only for signing in to the website.',
          '<b>School rule.</b> An organization owner can require 2FA for all members. Members without it keep their place in the organization but cannot use its resources until they enable 2FA (outside collaborators without it are removed).'
        ] },
        { id: 'a5-q-recovery-blk', type: 'question', q: 'a5-q-recovery' }
      ] },
      { id: 'a5-ssh', title: 'SSH keys', blocks: [
        { id: 'a5-ssh-t', type: 'text', html: '<p>An <dfn data-term="sshkey">SSH key pair</dfn> is like a lock and its key. You make both on your computer. You give the <b>lock</b> (the public key, a file ending in <code>.pub</code>) to GitHub. The <b>key</b> (the private key, no ending) never leaves your computer. When you push, your computer proves it holds the key that fits the lock.</p>' },
        { id: 'a5-ssh-fig', type: 'figure', alt: 'The private key stays on your computer; the public key is added to GitHub',
          caption: 'Only the <b>public</b> key (.pub) travels to GitHub. The private key stays at home.',
          svg: '<svg viewBox="0 0 520 130" width="100%" role="img" fill="none" stroke="currentColor" stroke-width="2" font-family="inherit" font-size="14"><rect x="10" y="20" width="200" height="90" rx="10"/><text x="110" y="48" text-anchor="middle" fill="currentColor" stroke="none" font-weight="700">Your computer</text><text x="110" y="74" text-anchor="middle" fill="currentColor" stroke="none">id_ed25519 (private)</text><text x="110" y="96" text-anchor="middle" fill="currentColor" stroke="none">id_ed25519.pub</text><rect x="310" y="20" width="200" height="90" rx="10"/><text x="410" y="48" text-anchor="middle" fill="currentColor" stroke="none" font-weight="700">GitHub</text><text x="410" y="84" text-anchor="middle" fill="currentColor" stroke="none">your public key</text><path d="M215 90 H305 M297 84 L305 90 L297 96"/><text x="260" y="82" text-anchor="middle" fill="currentColor" stroke="none">.pub only</text></svg>' },
        { id: 'a5-ssh-h', type: 'h', text: 'Step 1: create the key' },
        { id: 'a5-ssh-code', type: 'code', lang: 'bash', code: '$ ssh-keygen -t ed25519 -C "aino@example.com"\nGenerating public/private ed25519 key pair.\nEnter file in which to save the key (/home/student/.ssh/id_ed25519):\nEnter passphrase (empty for no passphrase):\nYour identification has been saved in ~/.ssh/id_ed25519\nYour public key has been saved in ~/.ssh/id_ed25519.pub' },
        { id: 'a5-ssh-t2', type: 'text', html: '<p><code>ed25519</code> is the current recommended key type. <code>-C</code> adds a label (your e-mail) so you can recognise the key later. Press <kbd>Enter</kbd> to accept the default file name. Real <code>ssh-keygen</code> also asks for a <b>passphrase</b>, a password for the key file. Set one on a shared or school computer: if someone copies the file, it is still locked. (The simulator skips the questions and creates the key straight away.)</p>' },
        { id: 'a5-ssh-c', type: 'callout', kind: 'warn', title: 'The most common mistake', html: 'Paste the contents of the file ending in <code>.pub</code>, never the file without an ending. The private key starts with <code>-----BEGIN OPENSSH PRIVATE KEY-----</code>. If that has been pasted anywhere, treat it as leaked and make a new pair. GitHub refuses private keys in the box, and so does the simulator.' },
        { id: 'a5-q-pub-blk', type: 'question', q: 'a5-q-pub' },
        { id: 'a5-ssh-sim1', type: 'interactive', widget: 'terminal', title: 'Create a key pair and look at both halves',
          caption: 'Make a key, show the public half, then test GitHub. The test fails because GitHub does not know the key yet.',
          config: {
            world: world({ cwd: '~' }), panels: [],
            tasks: [
              { id: 'keygen', text: 'Create a key: <code>ssh-keygen -t ed25519 -C "aino@example.com"</code>',
                check: function (w) { return !!w.readFile('~/.ssh/id_ed25519.pub') && !!w.readFile('~/.ssh/id_ed25519'); },
                hint: 'Press Enter at the questions; the simulator creates the files at once.', solution: 'ssh-keygen -t ed25519 -C "aino@example.com"' },
              { id: 'cat', text: 'Show the public key: <code>cat ~/.ssh/id_ed25519.pub</code>',
                check: function (w) { return w.ran(/^cat .*id_ed25519\.pub/); },
                hint: 'Use the file that ends in .pub.', solution: 'cat ~/.ssh/id_ed25519.pub' },
              { id: 'denied', text: 'Test the connection: <code>ssh -T git@github.com</code> (it says "Permission denied": GitHub does not know your key yet)',
                check: function (w) { return failed(w, /^ssh -T/); },
                solution: 'ssh -T git@github.com' }
            ] } }
      ] },
      { id: 'a5-gh', title: 'Add the key to GitHub and use it', blocks: [
        { id: 'a5-gh-t', type: 'text', html: '<p>Now give GitHub the public half.</p>' },
        { id: 'a5-gh-l', type: 'list', steps: true, items: [
          'Copy the whole line from <code>cat ~/.ssh/id_ed25519.pub</code>. It starts with <code>ssh-ed25519</code>.',
          'On github.com click your picture, then <b>Settings → SSH and GPG keys → New SSH key</b>.',
          'Give it a <b>Title</b> that names the computer ("HAMK laptop"), keep the type <b>Authentication Key</b>, paste the line under <b>Key</b> and press <b>Add SSH key</b>.',
          'Test with <code>ssh -T git@github.com</code>. GitHub answers "Hi aino! You\'ve successfully authenticated, but GitHub does not provide shell access." That is success: GitHub never gives a shell.',
          'Clone with the <b>SSH</b> address from the green <b>Code</b> button: <code>git clone git@github.com:hamk-projects/course-notes.git</code>.'
        ] },
        { id: 'a5-gh-c', type: 'callout', kind: 'tip', title: 'Already cloned with HTTPS?', html: 'Switch the existing repository without cloning again: <code>git remote set-url origin git@github.com:hamk-projects/course-notes.git</code>. One key works for all repositories you may access. Add one key per computer, and delete keys of computers you no longer use.' },
        { id: 'a5-q-sshurl-blk', type: 'question', q: 'a5-q-sshurl' },
        { id: 'a5-gh-sim', type: 'interactive', widget: 'github', title: 'Add your public key to GitHub, then clone over SSH',
          caption: 'The key is already created. Show it in Git Bash, copy the line (select it, <kbd>Ctrl</kbd>+<kbd>C</kbd>), paste it on the SSH keys page, then test and clone.',
          config: {
            start: '/settings/keys', personas: ['aino'], terminal: true,
            world: world({ run: ['ssh-keygen -t ed25519 -C aino@example.com'] }),
            tasks: [
              { id: 'add', text: 'Add the <b>public</b> key on <b>Settings → SSH and GPG keys</b> (<b>New SSH key</b>)',
                check: function (w) { return me(w).keys.length > 0; },
                hint: 'In Git Bash: cat ~/.ssh/id_ed25519.pub, then copy the line starting with ssh-ed25519.',
                solution: 'cat ~/.ssh/id_ed25519.pub, copy the line, then New SSH key, Title "Laptop", paste, Add SSH key' },
              { id: 'test', text: 'Test it: <code>ssh -T git@github.com</code> now succeeds',
                check: function (w) { return me(w).keys.length > 0 && w.log.some(function (l) { return /^ssh -T/.test(l.cmd); }); }, // real ssh -T exits with 1 even on success
                solution: 'ssh -T git@github.com' },
              { id: 'clone', text: 'Clone over SSH: <code>git clone git@github.com:hamk-projects/course-notes.git</code>',
                check: function (w) { return w.ran(/^git clone git@github\.com:/) && !!w.repo('~/course-notes'); },
                solution: 'git clone git@github.com:hamk-projects/course-notes.git' }
            ] } }
      ] },
      { id: 'a5-token', title: 'Personal access tokens', blocks: [
        { id: 'a5-token-t', type: 'text', html: '<p>A <dfn data-term="pat">personal access token</dfn> is a password you make for one job. Use it when a tool cannot open a browser or use SSH, for example a script or a build server. Prefer a <b>fine-grained</b> token, which you can limit in three ways:</p>' },
        { id: 'a5-token-l', type: 'list', items: [
          '<b>Repositories:</b> choose <b>Only select repositories</b> and pick just the one it needs, not <b>All repositories</b>.',
          '<b>Permissions:</b> give the least needed. For reading a repository, <b>Contents: Read-only</b> is enough; only add write when the tool must push.',
          '<b>Expiration:</b> pick a short life (30 days, not "No expiration"). A leaked token then stops working by itself.'
        ] },
        { id: 'a5-token-c', type: 'callout', kind: 'warn', title: 'GitHub shows the token once', html: 'After you press <b>Generate token</b>, copy it at once into a password manager or the tool that needs it. Reload the page and it is gone; you can only make a new one. A token can never do more than <em>you</em> may do: it is limited by your repository role.' },
        { id: 'a5-q-token-blk', type: 'question', q: 'a5-q-token' },
        { id: 'a5-token-sim', type: 'interactive', widget: 'github', title: 'Create a least-privilege token',
          caption: 'A grading script needs to read the thesis repository, nothing else.',
          config: {
            start: '/settings/tokens', personas: ['aino'], world: world({}),
            tasks: [
              { id: 'make', text: 'On <b>Settings → Developer settings → Personal access tokens</b>, generate a token that <b>expires in 30 days</b> and reaches <b>only</b> <code>hamk-projects/thesis-aino</code>',
                check: function (w) { return me(w).tokens.some(function (t) { return t.days === 30 && t.repos.length === 1 && t.repos[0] === 'hamk-projects/thesis-aino'; }); },
                hint: 'Choose "Only select repositories", then select the thesis repository.',
                solution: 'Generate new token, name "Grader", Expiration 30 days, Only select repositories: hamk-projects/thesis-aino, Generate token' },
              { id: 'ro', text: 'Make it <b>read-only</b> (Contents: Read-only), because the script only reads',
                check: function (w) { return me(w).tokens.some(function (t) { return t.perm === 'read' && t.days === 30 && t.repos.length === 1; }); },
                solution: 'Set Contents to Read-only before pressing Generate token' }
            ] } }
      ] },
      { id: 'a5-leak', title: 'When a secret leaks', blocks: [
        { id: 'a5-leak-t', type: 'text', html: '<p>Sooner or later someone commits a token or password by accident. Act in this order:</p>' },
        { id: 'a5-leak-l', type: 'list', ordered: true, steps: true, items: [
          '<b>Revoke first.</b> Delete the token or key on GitHub (<b>Settings → Developer settings</b> or <b>SSH and GPG keys</b>) and change the password. A revoked secret is useless, whoever has seen it.',
          '<b>Make a new one</b> (rotate) and update the tools that used the old one.',
          '<b>Then clean up</b> the repository. Deleting the file in a new commit does not help: the secret stays in the history (a later expert lesson shows how to rewrite history).',
          '<b>Tell your supervisor or IT.</b> It is not a failure, it is the rule.'
        ] },
        { id: 'a5-leak-c', type: 'callout', kind: 'info', title: 'Push protection', html: 'GitHub scans pushes for known kinds of tokens and keys. With <b>push protection</b> on, a push that contains one is blocked with a message that names the file. Organization owners and repository admins can switch it on for repositories. For your own account it is on by default when you push to public repositories.' },
        { id: 'a5-q-leak-blk', type: 'question', q: 'a5-q-leak' }
      ] },
      { id: 'a5-summary', title: 'Summary', blocks: [
        { id: 'a5-sum', type: 'list', items: [
          'Your account password does not work for Git over HTTPS. Use the browser sign-in window, an SSH key or a token.',
          'SSH: <code>ssh-keygen -t ed25519</code>, add the <b>.pub</b> file to GitHub, test with <code>ssh -T git@github.com</code>, clone with <code>git@github.com:owner/repo.git</code>.',
          'The private key never leaves your computer. Add a passphrase on shared machines.',
          'Tokens: fine-grained, one repository, least permissions, short expiry. Shown once.',
          'Turn on 2FA and store the recovery codes. Never share an account.',
          'Leak? Revoke, rotate, then clean up the history.'
        ] }
      ] }
    ],
    questions: [
      { id: 'a5-q-pw', type: 'mc', prompt: 'Aino runs <code>git push</code> over HTTPS and types her GitHub account password. What happens?',
        options: ['It works, passwords are the normal way', 'GitHub refuses it; she signs in through the browser window, or uses a token or SSH key', 'It works only if she has 2FA turned off'], answer: 1,
        hints: ['Think about what the Git Credential Manager window is for.'], explain: 'GitHub does not accept the account password for Git commands over HTTPS. Browser sign-in, a token or an SSH key replace it, and all of them work with 2FA turned on.' },
      { id: 'a5-q-recovery', type: 'mc', prompt: 'Ben turns on 2FA and gets ten recovery codes. Where should he keep them?',
        options: ['Only as a photo on the phone that has the authenticator app', 'In a password manager or printed in a safe place, apart from the phone', 'In a file called <code>codes.txt</code> in the thesis repository'], answer: 1,
        hints: ['What if the phone is lost?'], explain: 'The codes are for the day the phone is gone, so they must not live only on it. Never put them in a repository: they are secrets.' },
      { id: 'a5-q-pub', type: 'mc', prompt: 'Which file do you paste into <b>Settings → SSH and GPG keys</b>?',
        options: ['<code>~/.ssh/id_ed25519</code>', '<code>~/.ssh/id_ed25519.pub</code>', 'Either one, they are the same'], answer: 1,
        hints: ['One file is the lock, the other the key.'], explain: 'The <code>.pub</code> file is the public key and is safe to share. The file without an ending is the private key: it must never leave your computer.' },
      { id: 'a5-q-sshurl', type: 'fill', prompt: 'Complete the SSH clone command for <code>hamk-projects/course-notes</code>.',
        text: '[[a]]', answer: { a: ['git clone git@github.com:hamk-projects/course-notes.git', 'git clone git@github.com:hamk-projects/course-notes'] },
        hints: ['SSH addresses use <code>git@github.com:</code> followed by owner/repo.git'], explain: 'SSH addresses look like <code>git@github.com:owner/repo.git</code>; HTTPS ones start with <code>https://github.com/</code>.' },
      { id: 'a5-q-token', type: 'multi', prompt: 'A script only needs to read one thesis repository. Which settings fit a safe token?',
        options: ['Only select repositories: the thesis repository', 'All repositories', 'Expiration: 30 days', 'No expiration', 'Contents: Read-only'], answer: [0, 2, 4],
        hints: ['Give the least access for the shortest time.'], explain: 'Limit the token in repositories, permissions and time. "All repositories" and "No expiration" turn a small leak into a large one.' },
      { id: 'a5-q-leak', type: 'order', prompt: 'A token was committed and pushed by mistake. Put the response in order.',
        items: ['Revoke the token on GitHub', 'Create a new token and update the tool', 'Remove the secret from the history', 'Tell your supervisor or IT'],
        hints: ['Make the leaked secret useless before anything else.'], explain: 'A revoked token is harmless at once. Cleaning history comes later because others may already have copied the repository.' }
    ]
  });
})();
