/* b5 = Install Git and set it up (terminal simulator with a world that has no identity yet). */
(function () {
  function cfg(w, k) { return w.config[k]; }

  TDC.registerTopic({
    id: 'b5',
    title: 'Install Git and set it up',
    subtitle: 'Install Git on Windows, macOS or Linux, then tell it who you are so your work carries your name.',
    audience: 'everyone · no experience needed',
    objectives: [
      'explain what you install and why (Git itself, plus optional apps)',
      'install Git on Windows, macOS or Linux and check it with git --version',
      'choose sensible options in the Git for Windows installer',
      'set user.name, user.email and init.defaultBranch with git config',
      'read your settings with git config --list'
    ],
    glossary: {
      terminal: { term: 'terminal', def: 'A window where you type commands instead of clicking. On Windows with Git it is called <b>Git Bash</b>; on macOS it is the <b>Terminal</b> app.' },
      'package-manager': { term: 'package manager', def: 'A tool that installs software from the command line, such as <code>brew</code> on macOS or <code>apt</code> on Ubuntu.' },
      'git-config': { term: 'git config', def: 'The command that reads and writes Git\'s settings, such as your name and email. Each setting is a <code>key</code> (like <code>user.name</code>) and a value.' }
    },
    commands: [
      { cmd: 'git --version', does: 'Show the installed Git version (proves Git is installed)' },
      { cmd: 'git config --global user.name "Your Name"', does: 'Set the name stored in your commits' },
      { cmd: 'git config --global user.email "you@example.com"', does: 'Set the email stored in your commits' },
      { cmd: 'git config --global init.defaultBranch main', does: 'Name the first branch of new repositories main' },
      { cmd: 'git config --list', does: 'List all settings Git knows' },
      { cmd: 'git config user.name', does: 'Show one setting' }
    ],
    sections: [
      { id: 'b5-what', title: 'What you install and why', blocks: [
        { id: 'b5-what-t', type: 'text', html: '<p><b>Git</b> is a small program that records the history of a folder. It works on your own computer and needs no account. You use it from a <dfn data-term="terminal">terminal</dfn> (typed commands) or through an app with buttons.</p><p>Installing has two parts. The first is required, the second is optional:</p>' },
        { id: 'b5-what-tbl', type: 'table', head: ['Program', 'What it is', 'Needed?'], rows: [
          ['<b>Git</b>', 'The tool that does the work. Every other program below talks to it.', 'Yes'],
          ['<b>GitHub Desktop</b>', 'An app with buttons for the daily steps (see changes, commit, push).', 'Optional'],
          ['<b>VS Code</b>', 'A free text editor with Git built in.', 'Optional']
        ] },
        { id: 'b5-what-c', type: 'callout', kind: 'info', title: 'Git is not GitHub', html: 'Git runs on your computer. GitHub is a website that stores copies of repositories. You can install and use Git without any GitHub account; the account comes in the next lessons.' },
        { id: 'b5-q-what-blk', type: 'question', q: 'b5-q-what' }
      ] },
      { id: 'b5-install', title: 'Install Git', blocks: [
        { id: 'b5-install-t', type: 'text', html: '<p>Pick your operating system. Your choice is remembered for the rest of the course.</p>' },
        { id: 'b5-os', type: 'tabs', group: 'os', tabs: [
          { label: 'Windows', icon: '🪟', blocks: [
            { id: 'b5-win-steps', type: 'list', steps: true, items: [
              'Open <b>https://git-scm.com/download/win</b> in your browser. The download of the 64-bit installer starts by itself; if it does not, click <b>Click here to download</b>.',              'Open the downloaded file (named like <code>Git-2.xx.x-64-bit.exe</code>) from your Downloads folder. If Windows asks "Do you want to allow this app to make changes?", click <b>Yes</b>.',
              'Click <b>Next</b> on each screen. The table below lists the screens where a choice matters; for every screen not listed, keep the pre-selected default.',
              'On the last screen click <b>Install</b>, wait about a minute, then click <b>Finish</b>.',
              'Open the Start menu, type <b>Git Bash</b> and press <kbd>Enter</kbd>. A black or white window with a text prompt opens: this is your terminal.',
              'Type <code>git --version</code> and press <kbd>Enter</kbd>. You should see a line such as <code>git version 2.51.0.windows.1</code>.'
            ] },
            { id: 'b5-win-h', type: 'h', text: 'Installer screens and what to choose' },
            { id: 'b5-win-tbl', type: 'table', head: ['Screen', 'Choose', 'Why'], rows: [
              ['<b>Select Components</b>', 'Keep the defaults', 'Includes Git Bash and Git GUI. Nothing to change.'],
              ['<b>Choosing the default editor used by Git</b>', 'Pick <b>Use Visual Studio Code as Git\'s default editor</b> if you have or will install VS Code; otherwise pick <b>Use Notepad++ as Git\'s default editor</b> or <b>Use Notepad as Git\'s default editor</b>. Keep Vim only if you already know it.', 'Git sometimes opens an editor for a message. Vim is hard to leave for beginners; VS Code or Notepad is friendlier.'],
              ['<b>Adjusting the name of the initial branch in new repositories</b>', 'Select <b>Override the default branch name for new repositories</b> and type <code>main</code>', 'GitHub calls the first branch <code>main</code>. Matching it avoids confusion later.'],              ['<b>Adjusting your PATH environment</b>', '<b>Git from the command line and also from 3rd-party software</b> (recommended)', 'Lets GitHub Desktop, VS Code and other apps find Git.'],
              ['<b>Choosing the SSH executable</b>', '<b>Use bundled OpenSSH</b>', 'Needed later for SSH keys. No extra software.'],
              ['<b>Choosing HTTPS transport backend</b>', '<b>Use the OpenSSL library</b>', 'The default and fine for school networks.'],              ['<b>Configuring the line ending conversions</b>', '<b>Checkout Windows-style, commit Unix-style line endings</b>', 'Lets Windows and macOS users share files without invisible differences.'],
              ['<b>Configuring the terminal emulator to use with Git Bash</b>', '<b>Use MinTTY</b> (default)', 'A better window than the plain Windows console.'],
              ['<b>Choose the default behavior of git pull</b>', '<b>Fast-forward or merge</b> (default)', 'Explained in the lesson about pulling.'],
              ['<b>Choose a credential helper</b>', '<b>Git Credential Manager</b> (default)', 'Remembers your GitHub sign-in safely, so you do not type a password for every push.'],
              ['<b>Configuring extra options</b>', 'Keep <b>Enable file system caching</b> ticked', 'Makes Git faster. <b>Enable symbolic links</b> can stay off.'],
              ['<b>Configuring experimental options</b>', 'Leave everything unticked', 'These are unfinished features.']
            ] },
            { id: 'b5-win-c', type: 'callout', kind: 'tip', title: 'Missed a choice?', html: 'You can run the installer again at any time. The branch name can also be set with a command in this lesson, so nothing is lost.' }
          ] },
          { label: 'macOS', icon: '🍎', blocks: [
            { id: 'b5-mac-steps', type: 'list', steps: true, items: [
              'Open <b>Terminal</b>: press <kbd>Cmd</kbd>+<kbd>Space</kbd>, type <b>Terminal</b>, press <kbd>Enter</kbd>.',
              'Type <code>git --version</code> and press <kbd>Enter</kbd>.',
              'If Git is missing, macOS offers to install the <b>command line developer tools</b>. Click <b>Install</b>, agree to the licence and wait a few minutes. (You can start it yourself with <code>xcode-select --install</code>.)',
              'Run <code>git --version</code> again. You should see a line such as <code>git version 2.39.5 (Apple Git-154)</code>.'            ] },
            { id: 'b5-mac-brew', type: 'callout', kind: 'info', title: 'Want the newest Git?', html: 'Apple\'s Git works well for this course. If you use the <dfn data-term="package-manager">package manager</dfn> Homebrew, <code>brew install git</code> installs a newer one.' }
          ] },
          { label: 'Linux', icon: '🐧', blocks: [
            { id: 'b5-lin-t', type: 'text', html: '<p>Open a terminal (often <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>T</kbd>) and use the <dfn data-term="package-manager">package manager</dfn> of your distribution. Each command asks for your password.</p>' },
            { id: 'b5-lin-tbl', type: 'table', head: ['Distribution', 'Command'], rows: [
              ['Ubuntu, Debian, Linux Mint', '<code>sudo apt update &amp;&amp; sudo apt install git</code>'],
              ['Fedora', '<code>sudo dnf install git</code>'],
              ['Arch', '<code>sudo pacman -S git</code>'],
              ['openSUSE', '<code>sudo zypper install git</code>']
            ] },
            { id: 'b5-lin-t2', type: 'text', html: '<p>Then run <code>git --version</code>. Any version 2.30 or newer is fine.</p>' }
          ] }
        ] },
        { id: 'b5-q-gitbash-blk', type: 'question', q: 'b5-q-branch' }
      ] },
      { id: 'b5-optional', title: 'Optional apps', blocks: [
        { id: 'b5-opt-t', type: 'text', html: '<p>You can do everything in this course in the terminal. The two apps below are for people who prefer buttons. Install them after Git; both are free.</p>' },
        { id: 'b5-opt-tbl', type: 'table', head: ['App', 'Download from', 'First start'], rows: [
          ['<b>GitHub Desktop</b>', '<b>desktop.github.com</b>, button <b>Download</b>', 'Run the installer. It opens by itself; sign in with your GitHub account later, when you have one.'],
          ['<b>VS Code</b>', '<b>code.visualstudio.com</b>, button <b>Download</b>', 'Run the installer. On Windows keep <b>Add to PATH</b> ticked so <code>code .</code> works in the terminal.']        ] },
        { id: 'b5-opt-c', type: 'callout', kind: 'staff', title: 'On a managed work computer', html: 'You may not be allowed to install software. Ask IT to install Git for Windows (or the Git package) and, if you want them, GitHub Desktop and VS Code. Give them the names from the table above.' }
      ] },
      { id: 'b5-config', title: 'Tell Git who you are', blocks: [
        { id: 'b5-config-t', type: 'text', html: '<p>Every commit records <em>who</em> made it. Git has no way to guess, so you set your <b>name</b> and <b>email</b> once with <dfn data-term="git-config">git config</dfn>. The option <code>--global</code> means "for every repository on this computer", so you do it only once.</p>' },
        { id: 'b5-config-code', type: 'code', lang: 'bash', code: '$ git config --global user.name "Aino Student"\n$ git config --global user.email "aino@example.com"\n$ git config --global init.defaultBranch main' },
        { id: 'b5-config-tbl', type: 'table', head: ['Setting', 'Meaning', 'Tip'], rows: [
          ['<code>user.name</code>', 'The name shown on your commits', 'Your real name; keep the quotes if it has a space.'],
          ['<code>user.email</code>', 'The email shown on your commits', 'Use the email of your GitHub account so GitHub links commits to you.'],
          ['<code>init.defaultBranch</code>', 'Name of the first branch in new repositories', 'Use <code>main</code>. If you chose it in the Windows installer, setting it again does no harm.']
        ] },
        { id: 'b5-config-c', type: 'callout', kind: 'tip', title: 'Keep your email private', html: 'Commits in public repositories show the email you set. GitHub gives you a private address for this: on github.com open <b>Settings → Emails</b> and tick <b>Keep my email addresses private</b>. It then shows an address like <code>12345678+username@users.noreply.github.com</code>. Use that as <code>user.email</code>.' },        { id: 'b5-q-email-blk', type: 'question', q: 'b5-q-global' },
        { id: 'b5-sim', type: 'interactive', widget: 'terminal', title: 'Install check and first-time setup',
          caption: 'A brand-new computer where Git has just been installed. Type each command and press Enter. If you mistype a value, run the command again with the right one.',
          config: {
            world: { config: {}, cwd: '~' },
            tasks: [
              { id: 'ver', text: 'Check that Git is installed: <code>git --version</code>', check: function (w) { return w.ran(/^git --version/); }, solution: 'git --version' },
              { id: 'name', text: 'Set your name (any name): <code>git config --global user.name "Aino Student"</code>', check: function (w) { return !!cfg(w, 'user.name'); }, hint: 'Put the name in double quotes.', solution: 'git config --global user.name "Aino Student"' },
              { id: 'email', text: 'Set your email: <code>git config --global user.email "aino@example.com"</code>', check: function (w) { return /.@./.test(cfg(w, 'user.email') || ''); }, hint: 'An email has an @ sign.', solution: 'git config --global user.email "aino@example.com"' },
              { id: 'branch', text: 'Make <code>main</code> the default branch name: <code>git config --global init.defaultBranch main</code>', check: function (w) { return cfg(w, 'init.defaultBranch') === 'main'; }, solution: 'git config --global init.defaultBranch main' },
              { id: 'list', text: 'Show all settings: <code>git config --list</code>', check: function (w) { return w.ran(/^git config\b.*(--list|-l)\b/); }, solution: 'git config --list' }
            ]
          } }
      ] },
      { id: 'b5-check', title: 'Check your setup', blocks: [
        { id: 'b5-check-t', type: 'text', html: '<p><code>git config --list</code> prints one <code>key=value</code> line per setting. Look for your three lines:</p>' },
        { id: 'b5-check-code', type: 'code', lang: 'bash', code: '$ git config --list\nuser.name=Aino Student\nuser.email=aino@example.com\ninit.defaultBranch=main' },
        { id: 'b5-check-t2', type: 'text', html: '<p>On a real computer the list is longer (the installer adds lines about credentials and line endings); that is normal. To read one value, name it: <code>git config user.name</code>. To change a value, run the <code>set</code> command again with the new text.</p>' },
        { id: 'b5-check-c', type: 'callout', kind: 'warn', title: 'Common mistakes', html: 'A missing quote around a name with a space, or typing <code>git config user.name Aino Student</code> without quotes. Without <code>user.name</code> and <code>user.email</code>, your first <code>git commit</code> stops with "Please tell me who you are".' },
        { id: 'b5-q-fill-blk', type: 'question', q: 'b5-q-fill' }
      ] },
      { id: 'b5-summary', title: 'Summary', blocks: [
        { id: 'b5-sum', type: 'list', items: [
          'Git is required; GitHub Desktop and VS Code are optional extras.',
          'Windows: run the installer, choose <b>main</b> as the initial branch name and keep <b>Git Credential Manager</b>. macOS: <code>git --version</code> offers the install. Linux: use your package manager.',
          '<code>git --version</code> proves Git is installed.',
          'Set <code>user.name</code>, <code>user.email</code> and <code>init.defaultBranch main</code> once with <code>--global</code>; check them with <code>git config --list</code>.'
        ] }
      ] }
    ],
    questions: [
      { id: 'b5-q-what', type: 'mc', prompt: 'You want to start using Git on your own laptop. What do you need first?',
        options: ['A GitHub account', 'Git installed on the laptop', 'GitHub Desktop', 'A paid licence'], answer: 1, shuffle: false,
        hints: ['Which program records the history?'], explain: 'Git itself does the work and runs locally. A GitHub account and the apps are useful later but not required to start.' },
      { id: 'b5-q-branch', type: 'mc', prompt: 'In the Windows installer, which choice for the initial branch name matches GitHub?',
        options: ['Let Git decide (master)', 'Override the default branch name and type <code>main</code>', 'Use the name of my computer'], answer: 1, shuffle: false,
        hints: ['GitHub names its first branch the same way.'], explain: 'GitHub creates repositories with <code>main</code>. Using the same name locally avoids a mismatch when you upload your work.' },
      { id: 'b5-q-global', type: 'mc', prompt: 'What does <code>--global</code> do in <code>git config --global user.name "Aino"</code>?',
        options: ['Uploads your name to GitHub', 'Applies the setting to every repository on this computer', 'Makes the name visible to everyone on the internet'], answer: 1, shuffle: false,
        hints: ['Think about doing it only once.'], explain: '<code>--global</code> stores the setting in your user account on this computer. It does not contact GitHub, so you set it once.' },
      { id: 'b5-q-fill', type: 'fill', prompt: 'Complete the command that shows every setting.', text: 'git config [[a]]',
        answer: { a: ['--list', '-l', '--global --list', '--list --global', '--global -l', '-l --global'] }, explain: '<code>--list</code> prints all settings as <code>key=value</code>.' },
      { id: 'b5-q-multi', type: 'multi', prompt: 'Which settings should you give Git before your first commit?',
        options: ['<code>user.name</code>', '<code>user.email</code>', 'Your GitHub password', 'Your home address'], answer: [0, 1], explain: 'Git writes name and email into each commit. It never needs your password in its settings.' },
      { id: 'b5-q-match', type: 'match', prompt: 'Match the system to how you check or install Git.',
        pairs: [['Windows', 'Git for Windows installer, then Git Bash'], ['macOS', 'git --version offers the developer tools'], ['Ubuntu', 'sudo apt install git']], explain: 'Each system has its own route, but all end with <code>git --version</code>.' }
    ]
  });
})();
