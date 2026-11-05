/* e4 = Automation with GitHub Actions. One github-widget simulation: failing check on a pull request, fix, required check.
 * VERIFY: "set up a workflow yourself" link on the Actions tab (not in docs; see FACTS.md). */
TDC.registerTopic({
  id: 'e4',
  title: 'Automation with GitHub Actions',
  subtitle: 'Let GitHub check your thesis for you on every push, and refuse to merge when the check fails.',
  audience: 'students and staff who know pull requests · expert level',
  objectives: [
    'read and write a workflow file (on, jobs, runs-on, steps, uses, run)',
    'choose a trigger: push, pull_request, manual or schedule',
    'read a failed run and fix it with a new commit',
    'make a check required with a ruleset so a failing pull request cannot be merged',
    'keep passwords and tokens in secrets, never in code, and know the minutes limits'
  ],
  glossary: {
    actions: { term: 'GitHub Actions', def: 'GitHub’s built-in automation. It starts small programs (workflows) on GitHub’s computers when something happens in your repository.' },
    workflow: { term: 'workflow', def: 'One automation, described in a YAML text file in <code>.github/workflows/</code>. It says when to run and what to do.' },
    runner: { term: 'runner', def: 'The temporary computer, hosted by GitHub, that carries out a job. <code>ubuntu-latest</code> is a Linux runner.' },
    statuscheck: { term: 'status check', def: 'A green tick or red cross on a commit or pull request, reported by an automation such as a workflow.' },
    ghsecret: { term: 'secret', def: 'A password or token stored encrypted in the repository or organization settings, so workflows can use it without it appearing in the code.' }
  },
  commands: [
    { cmd: 'git add .github/workflows/check.yml', does: 'Stage a workflow file (it only runs once it is pushed to GitHub)' },
    { cmd: 'git push', does: 'Send the commit; a push or pull_request trigger starts the workflow on GitHub' }
  ],
  sections: [
    { id: 'e4-why', title: 'Why automate checks?', blocks: [
      { id: 'e4-t1', type: 'text', html: '<p>A supervisor cannot open every pull request and test every link, build every PDF and run every test. A computer can, and it never gets tired. <dfn data-term="actions">GitHub Actions</dfn> starts a small program on GitHub’s own computers each time something happens in your repository, for example when someone pushes a commit or opens a pull request.</p>' },
      { id: 'e4-t2', type: 'text', html: '<p>Typical jobs in school projects:</p>' },
      { id: 'e4-l1', type: 'list', items: ['<b>Build the thesis PDF</b> from the Markdown chapters, so the supervisor always sees the latest version.', '<b>Check links and file names</b> so a chapter never points to a missing figure.', '<b>Run tests</b> for a programming project, so broken code does not reach <code>main</code>.'] },
      { id: 'e4-t3', type: 'text', html: '<p>The result appears as a <dfn data-term="statuscheck">status check</dfn>: a green tick or a red cross next to the commit and on the pull request. Combined with a ruleset (section 5), a red cross can even block the merge.</p>' },
      { id: 'e4-c1', type: 'callout', kind: 'key', title: 'Key idea', html: 'A workflow is a recipe stored <em>in the repository</em>. It is versioned, reviewed and shared like any other file. Nobody needs to install anything on their own computer.' },
      { id: 'e4-q1', type: 'question', q: 'e4-q-where' }
    ] },
    { id: 'e4-yaml', title: 'Reading a workflow file', blocks: [
      { id: 'e4-t4', type: 'text', html: '<p>A <dfn data-term="workflow">workflow</dfn> is a text file in <b>YAML</b> format, stored in the folder <code>.github/workflows/</code>. YAML uses <b>indentation</b> (spaces, never tabs) to show what belongs to what. Here is a complete workflow that checks Aino’s thesis:</p>' },
      { id: 'e4-code1', type: 'code', lang: 'yaml', title: '.github/workflows/check.yml', code: 'name: Check thesis\n\non:\n  push:\n    branches: [main]\n  pull_request:\n\njobs:\n  check:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v7\n      - name: Check that every link points to a file\n        run: ./scripts/check-links.sh' },
      { id: 'e4-tbl1', type: 'table', head: ['Key', 'What it means'], compact: true,
        rows: [['<code>name</code>', 'The workflow’s title, shown in the Actions tab.'],
               ['<code>on</code>', 'The <b>trigger</b>: when does it start?'],
               ['<code>jobs</code>', 'The work to do. Each job gets a fresh computer. Here there is one job called <code>check</code>.'],
               ['<code>runs-on</code>', 'Which <dfn data-term="runner">runner</dfn> (kind of computer): <code>ubuntu-latest</code> is Linux.'],
               ['<code>steps</code>', 'The list of steps in a job, run in order. A step that fails stops the job.'],
               ['<code>uses</code>', 'Use a ready-made action written by someone else. <code>actions/checkout@v7</code> copies your repository onto the runner; almost every workflow starts with it.'],
               ['<code>run</code>', 'Run a command in the shell, like in your terminal.']] },
      { id: 'e4-c2', type: 'callout', kind: 'warn', title: 'Common mistake', html: 'The runner starts empty. Without <code>actions/checkout</code> your files are not there and the first command fails with “No such file”. Also, a wrong indentation makes the whole file invalid: GitHub then shows an error on the workflow instead of running it.' },
      { id: 'e4-q2', type: 'question', q: 'e4-q-fill' },
      { id: 'e4-q3', type: 'question', q: 'e4-q-match' }
    ] },
    { id: 'e4-triggers', title: 'When does it run? Triggers', blocks: [
      { id: 'e4-t5', type: 'text', html: '<p>The <code>on</code> key decides when a workflow starts. The ones you will use most:</p>' },
      { id: 'e4-tbl2', type: 'table', head: ['Trigger', 'Starts when…', 'Good for'],
        rows: [['<code>push</code>', 'someone pushes commits (optionally only to some branches)', 'checking <code>main</code> after every merge'],
               ['<code>pull_request</code>', 'a pull request is opened or gets new commits', 'checks that must pass <em>before</em> merging'],
               ['<code>workflow_dispatch</code>', 'someone presses <b>Run workflow</b> in the Actions tab', 'a manual job, such as building the final PDF'],
               ['<code>schedule</code>', 'at set times (cron syntax)', 'a weekly link check of a course site']] },
      { id: 'e4-code2', type: 'code', lang: 'yaml', title: 'Several triggers at once', code: 'on:\n  pull_request:\n  workflow_dispatch:\n  schedule:\n    - cron: "0 6 * * 1"   # every Monday at 06:00 UTC' },
      { id: 'e4-c3', type: 'callout', kind: 'tip', html: 'For checks you want on pull requests, use <code>pull_request</code>. A workflow that only listens to <code>push</code> on <code>main</code> reports the problem <em>after</em> the bad change is already merged.' },
      { id: 'e4-q4', type: 'question', q: 'e4-q-trigger' }
    ] },
    { id: 'e4-practice', title: 'Practice: a failing check on a pull request', blocks: [
      { id: 'e4-t6', type: 'text', html: '<p>Aino’s pull request <b>Add chapter 2</b> turned red. The thesis repository has a workflow called <b>Check thesis</b> that tests every link in the chapters. Find out why it failed, fix it with a commit, then make the check <em>required</em> so this can never be merged red.</p>' },
      { id: 'e4-t7', type: 'text', html: '<p>Opening the details of a run shows the <b>log</b>: the output of every step. Always read the first red line. It normally names the file and the problem.</p>' },
      { id: 'e4-gh1', type: 'interactive', widget: 'github', title: 'Read a failed run, fix it, and require the check',
        caption: 'You start as Aino (Write access to the repository). For the last task, switch to teacher with “Practise as”: only Admins can change rulesets.',
        config: {
          start: '/hamk-projects/thesis-aino', personas: ['aino', 'teacher'],
          world: {
            me: 'aino', myName: 'Aino Student', config: { 'user.name': 'Aino Student', 'user.email': 'aino@example.com' },
            users: { teacher: { name: 'Tiina Teacher' } },
            orgs: { 'hamk-projects': { displayName: 'HAMK Projects', owners: ['teacher'], members: ['aino'], settings: { basePermission: 'read' } } },
            remotes: { 'hamk-projects/thesis-aino': {
              description: 'Bachelor thesis: version control at HAMK', collaborators: { aino: 'write' },
              commits: [
                { msg: 'Initial commit', author: 'teacher', files: {
                  'README.md': '# Thesis: Aino Student\n',
                  '.github/workflows/check.yml': 'name: Check thesis\n\non:\n  push:\n    branches: [main]\n  pull_request:\n\njobs:\n  check:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v7\n      - name: Check that every link points to a file\n        run: ./scripts/check-links.sh\n',
                  'scripts/check-links.sh': '#!/usr/bin/env bash\n# Fails when a Markdown link in chapters/ points to a missing file.\n' } },
                { msg: 'Add chapter 1', author: 'aino', files: { 'chapters/01-intro.md': '# Introduction\n\n![Overview](figures/overview.png)\n', 'figures/overview.png': '(image)' } }],
              branches: { 'chapter-2': [
                { msg: 'Add figure for chapter 2', author: 'aino', files: { 'figures/method-diagram.png': '(image)' } },
                { msg: 'Add chapter 2', author: 'aino', files: { 'chapters/02-methods.md': '# Methods\n\nThe method is shown below.\n\n![Method](figures/methd-diagram.png)\n' } }] },
              pulls: [{ title: 'Add chapter 2', head: 'chapter-2', author: 'aino', body: 'Methods chapter and its diagram.' }],
              ci: { name: 'Check thesis', test: function (tree) {
                var log = ['Run actions/checkout@v7', 'Run ./scripts/check-links.sh'], bad = [];
                Object.keys(tree).filter(function (p) { return /^chapters\/.*\.md$/.test(p); }).forEach(function (p) {
                  var re = /\]\(([^)]+)\)/g, m;
                  while ((m = re.exec(tree[p]))) { if (!/^https?:/.test(m[1]) && !(m[1] in tree)) bad.push('Error: ' + p + ' links to ' + m[1] + ', but that file does not exist.'); }
                });
                if (bad.length) return { ok: false, log: log.concat(bad, 'Error: Process completed with exit code 1.') };
                return { ok: true, log: log.concat('All links point to existing files.') };
              } }
            } }
          },
          tasks: [
            { id: 'open-wf', text: 'Open the workflow file: in the <b>Code</b> tab go to <code>.github/workflows/check.yml</code>',
              check: function (w) { return w.did('visit', function (e) { return /\/blob\/[^/]+\/\.github\/workflows\/check\.yml$/.test(e.path); }); },
              hint: 'On the Code tab, open the folder <code>.github</code>, then <code>workflows</code>.', solution: 'Code tab → .github → workflows → check.yml' },
            { id: 'read-log', text: 'In the <b>Actions</b> tab open the failed run and read its log',
              check: function (w) { return w.did('visit-run', function (e) { return e.ok === false; }); },
              hint: 'Runs with a red cross failed. Click the run’s name.', solution: 'Actions tab → click the red run' },
            { id: 'fix', text: 'Fix the problem: edit <code>chapters/02-methods.md</code> <b>on the branch chapter-2</b> and commit. The log names the wrong file name.',
              check: function (w) { var s = w.server.repos['hamk-projects/thesis-aino']; return w.ciResult('hamk-projects/thesis-aino', s.refs['chapter-2']).ok; },
              hint: 'The file is <code>method-diagram.png</code>, but the link says <code>methd-diagram.png</code>. Open the file, press the pencil, choose “Commit directly to the chapter-2 branch”.',
              solution: 'Edit chapters/02-methods.md on chapter-2: change figures/methd-diagram.png to figures/method-diagram.png, then commit' },
            { id: 'green', text: 'Open the pull request and see the check turn green',
              check: function (w) {
                var s = w.server.repos['hamk-projects/thesis-aino'], ev = w.events || [], last = -1;
                if (!w.ciResult('hamk-projects/thesis-aino', s.refs['chapter-2']).ok) return false;
                ev.forEach(function (e, i) { if (e.type === 'commit') last = i; });
                return ev.some(function (e, i) { return i > last && e.type === 'visit' && /\/pull\/1$/.test(e.path); });
              },
              hint: 'After the fix, open Pull requests → Add chapter 2.', solution: 'Pull requests → Add chapter 2' },
            { id: 'required', text: 'Switch to <b>teacher</b> and create a ruleset that requires status checks: <b>Settings → Rules → Rulesets → New ruleset</b>',
              check: function (w) { return w.server.repos['hamk-projects/thesis-aino'].rules.some(function (r) { return r.requireChecks && r.enforcement !== 'disabled'; }); },
              hint: 'Tick “Require status checks to pass”, keep Enforcement status on Active, then Create.', solution: 'As teacher: Settings → Rules → New ruleset → Require status checks to pass → Create' }
          ]
        } },
      { id: 'e4-c4', type: 'callout', kind: 'info', title: 'What the simulator simplifies', html: 'The simulator does not run YAML. Its “Check thesis” workflow is a ready-made test of the links, so you can practise reading logs and fixing. Editing the workflow file changes nothing in the run. In the real ruleset you also pick <em>which</em> check is required (by its job name, here <code>check</code>); the simulator makes all checks required.' },
      { id: 'e4-q5', type: 'question', q: 'e4-q-order' }
    ] },
    { id: 'e4-required', title: 'Making a check required', blocks: [
      { id: 'e4-t8', type: 'text', html: '<p>By default a red cross is only a warning: the <b>Merge</b> button still works. To <em>enforce</em> the check, add it to a ruleset: <b>Settings → Rules → Rulesets → New ruleset → New branch ruleset</b>, then tick <b>Require status checks to pass</b> and add the check by name.</p>' },      { id: 'e4-t9', type: 'text', html: '<p>With the ruleset active, the pull request shows “Required statuses must pass before merging” and the merge button stays disabled until the check is green. The thesis repository from lesson 3.3 can combine this with <b>Require a pull request before merging</b> and one approval: the supervisor reviews, the computer checks.</p>' },
      { id: 'e4-c5', type: 'callout', kind: 'warn', title: 'Common mistake', html: 'A check can be chosen as required only after it has run at least once in the repository. And if you rename the job later, the old name is never reported again, so every pull request waits forever. Rename with care.' },      { id: 'e4-c6', type: 'callout', kind: 'school', title: 'At HAMK', html: 'A required check protects the supervisor’s time: the pull request cannot be merged with broken links or a failing build, and the student sees the reason at once. The organization owner (or a repository Admin) sets this once per repository; a ruleset created in the organization settings can apply it to many repositories.' },
      { id: 'e4-q6', type: 'question', q: 'e4-q-required' }
    ] },
    { id: 'e4-secrets', title: 'Secrets, permissions and minutes', blocks: [
      { id: 'e4-t10', type: 'text', html: '<p>Some workflows need a password or token, for example to publish a website or to call a service. <b>Never write it in the workflow file or any other file.</b> Everyone who can read the repository would see it, and Git history keeps it forever. Store it as a <dfn data-term="ghsecret">secret</dfn> instead: <b>Settings → Secrets and variables → Actions → New repository secret</b>. An organization can also hold secrets shared by many repositories (<b>organization Settings → Secrets and variables → Actions</b>).</p>' },      { id: 'e4-code3', type: 'code', lang: 'yaml', title: 'Use a secret in a step', code: '    steps:\n      - uses: actions/checkout@v7\n      - name: Publish\n        run: ./scripts/publish.sh\n        env:\n          PUBLISH_TOKEN: ${{ secrets.PUBLISH_TOKEN }}' },
      { id: 'e4-t11', type: 'text', html: '<p>Once saved, a secret value cannot be read again, only replaced. GitHub hides it in the logs (it prints <code>***</code>). Secrets are also <b>not</b> given to workflows triggered by pull requests from forks, so an outsider cannot steal them with a pull request.</p>' },      { id: 'e4-h1', type: 'h', text: 'Limit what the workflow may do' },
      { id: 'e4-code4', type: 'code', lang: 'yaml', title: 'Give the run a read-only token', code: 'permissions:\n  contents: read' },
      { id: 'e4-t12', type: 'text', html: '<p>Every run gets a temporary token. The <code>permissions</code> key trims it to what the job really needs. <code>contents: read</code> is enough for a check that only reads files.</p>' },
      { id: 'e4-h2', type: 'h', text: 'Minutes and plans' },
      { id: 'e4-t13', type: 'text', html: '<p>Runs use computer time, counted in <b>minutes</b>. Standard GitHub-hosted runners are free for <b>public</b> repositories. For <b>private</b> repositories each plan includes a monthly allowance (for example 2,000 minutes on GitHub Free and 3,000 on Team), and more costs money.</p>' },      { id: 'e4-c7', type: 'callout', kind: 'school', title: 'At HAMK', html: 'Ask the organization owner how many minutes the school plan includes before you add heavy workflows (long builds, tests that run on every push) to many private repositories. Keep checks short, and use <code>pull_request</code> instead of running everything on every push to every branch.' },
      { id: 'e4-q7', type: 'question', q: 'e4-q-secret' },
      { id: 'e4-q8', type: 'question', q: 'e4-q-minutes' }
    ] },
    { id: 'e4-new', title: 'Adding your own workflow', blocks: [
      { id: 'e4-t14', type: 'text', html: '<p>A workflow file is just a file. Two routes get it into the repository:</p>' },
      { id: 'e4-tabs1', type: 'tabs', group: 'tool', tabs: [
        { label: 'Terminal', blocks: [
          { id: 'e4-code5', type: 'code', lang: 'bash', code: '$ mkdir -p .github/workflows\n$ code .github/workflows/check.yml\n$ git add .github/workflows/check.yml\n$ git commit -m "Add link check workflow"\n$ git push' },
          { id: 'e4-t15', type: 'text', html: '<p>The folder name is exact: <code>.github/workflows</code>, and the files end in <code>.yml</code> or <code>.yaml</code>. After the push the run appears in the <b>Actions</b> tab.</p>' }] },
        { label: 'GitHub website', blocks: [
          { id: 'e4-t16', type: 'text', html: '<p>Open the <b>Actions</b> tab and choose a starter workflow, or <b>set up a workflow yourself</b>. GitHub opens the editor with the right folder; write the YAML and press <b>Commit changes</b>.</p>' },          { id: 'e4-t17', type: 'text', html: '<p>To start a workflow with <code>workflow_dispatch</code> by hand, open it in the Actions tab and press <b>Run workflow</b>.</p>' }] }
      ] },
      { id: 'e4-t18', type: 'text', html: '<p>Here is a second recipe: build the thesis PDF with Pandoc on every push to a pull request, and keep the PDF as a downloadable <em>artifact</em> on the run page.</p>' },
      { id: 'e4-code6', type: 'code', lang: 'yaml', title: '.github/workflows/build-pdf.yml', code: 'name: Build thesis PDF\n\non:\n  pull_request:\n  workflow_dispatch:\n\njobs:\n  pdf:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v7\n      - name: Install Pandoc and LaTeX\n        run: sudo apt-get update && sudo apt-get install -y pandoc texlive-latex-base texlive-latex-recommended\n      - name: Build the PDF\n        run: pandoc chapters/*.md -o thesis.pdf\n      - uses: actions/upload-artifact@v7\n        with:\n          name: thesis-pdf\n          path: thesis.pdf' },
      { id: 'e4-c8', type: 'callout', kind: 'tip', title: 'Debug on a branch', html: 'Test a new workflow on a branch or in a pull request, not on <code>main</code>. The run log shows each step in order; fix the first red step and push again.' }
    ] },
    { id: 'e4-summary', title: 'Summary', blocks: [
      { id: 'e4-sum', type: 'list', items: [
        'A <b>workflow</b> is a YAML file in <code>.github/workflows/</code>; <code>on</code> says when, <code>jobs</code> says what.',
        'Each job runs on a fresh <b>runner</b> (<code>runs-on</code>); start with <code>actions/checkout@v7</code>, then <code>uses</code> ready-made actions or <code>run</code> commands.',
        'Use <code>pull_request</code> for checks before merging, <code>push</code> for after, <code>workflow_dispatch</code> for manual and <code>schedule</code> for timed runs.',
        'A failed run: open the Actions tab, read the log from the first red line, fix with a commit, and the check re-runs.',
        'A ruleset with <b>Require status checks to pass</b> blocks merging red pull requests.',
        'Passwords and tokens go in <b>secrets</b>, never in code. Private repositories use a monthly minute allowance.'
      ] }
    ] }
  ],
  questions: [
    { id: 'e4-q-where', type: 'mc', prompt: 'Where must a GitHub Actions workflow file be stored for GitHub to run it?',
      options: ['In the folder <code>.github/workflows/</code> of the repository', 'In the organization’s Settings page as plain text', 'In a file called <code>actions.md</code> in the repository root', 'On the supervisor’s own computer'],
      answer: 0, hints: ['The workflow lives in the repository, next to your files.'], explain: 'Workflows are YAML files in <code>.github/workflows/</code>. Because they are ordinary files, they are versioned and reviewed like the rest of the project.' },
    { id: 'e4-q-fill', type: 'fill', prompt: 'Complete the line so the job runs on a Linux runner.', text: 'runs-on: [[a]]', answer: { a: ['ubuntu-latest', 'ubuntu-24.04', 'ubuntu-22.04'] },
      hints: ['It names the operating system and “latest”.'], explain: '<code>runs-on: ubuntu-latest</code> picks a GitHub-hosted Linux computer. Windows and macOS runners exist too (<code>windows-latest</code>, <code>macos-latest</code>).' },
    { id: 'e4-q-match', type: 'match', prompt: 'Match the key to its meaning.',
      pairs: [['on', 'when the workflow starts'], ['runs-on', 'which kind of computer does the work'], ['uses', 'run a ready-made action, such as actions/checkout@v7'], ['run', 'execute a shell command']], explain: '<code>on</code> is the trigger; <code>runs-on</code>, <code>uses</code> and <code>run</code> live inside a job.' },
    { id: 'e4-q-trigger', type: 'multi', prompt: 'Aino wants the link check to run on every pull request <em>and</em> to be startable by hand. Which triggers does she list under <code>on</code>?',
      options: ['<code>pull_request</code>', '<code>workflow_dispatch</code>', '<code>schedule</code>', '<code>runs-on</code>'], answer: [0, 1],
      hints: ['One trigger is for pull requests, one is the “Run workflow” button.'], explain: '<code>pull_request</code> covers every pull request; <code>workflow_dispatch</code> adds the <b>Run workflow</b> button. <code>schedule</code> is for timed runs she did not ask for, and <code>runs-on</code> is not a trigger at all: it picks the runner inside a job.' },
    { id: 'e4-q-order', type: 'order', prompt: 'A check on your pull request is red. Put the steps in a sensible order.',
      items: ['Open the Actions tab and the failed run', 'Read the log from the first red line', 'Fix the problem and commit to the same branch', 'Wait for the check to run again and turn green', 'Merge the pull request'], explain: 'Find the cause in the log first, fix on the same branch (the pull request updates and the check re-runs), and merge only when it is green.' },
    { id: 'e4-q-required', type: 'mc', prompt: 'The check on Ben’s pull request is red, but the <b>Merge</b> button is still green and clickable for the supervisor. What is missing?',
      options: ['A ruleset (or branch protection) that requires the status check to pass', 'A second workflow file with the same name', 'The <code>runs-on</code> key in the workflow', 'Ben must be an organization owner'],
      answer: 0, hints: ['A red cross alone is only information.'], explain: 'By default a failing check only warns. Adding <b>Require status checks to pass</b> to a ruleset makes GitHub block the merge until the check is green.' },
    { id: 'e4-q-secret', type: 'mc', prompt: 'A workflow needs a token to publish the course website. Where should the token be stored?',
      options: ['In a repository (or organization) secret, read in the workflow as <code>secrets.NAME</code>', 'Directly in the workflow file, since the repository is private', 'In the README so the team can find it', 'In a comment on the pull request'],
      answer: 0, hints: ['Think of something no one can read back later.'], explain: 'Secrets are stored encrypted and masked in logs. Even in a private repository, a token in a file is copied to every clone and stays in the history, and people lose access to private repositories later.' },
    { id: 'e4-q-minutes', type: 'mc', prompt: 'The school has 40 private project repositories, each with a workflow that runs a 10-minute build on <em>every push to every branch</em>. What is the most likely problem?',
      options: ['The monthly Actions minutes run out', 'GitHub refuses more than 10 workflow files', 'The workflows stop working on public repositories', 'The secrets are deleted after a month'],
      answer: 0, hints: ['Think about what runs cost on private repositories.'], explain: 'Private repositories draw from a monthly allowance of minutes. Many long runs use it up. Run builds on <code>pull_request</code>, keep them short, and ask the organization owner about the plan.' }
  ]
});
