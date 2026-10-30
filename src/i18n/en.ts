// SPDX-License-Identifier: Apache-2.0
// English texts of the site. The marketing sentences come word for word from the locked value proposition
// (research/proposition-de-valeur.md, Lyes, 24 and 27/10/2026): change them only with his agreement.
// French arrives later as `fr.ts`, typed by `Messages`.

export const en = {
  meta: {
    siteName: 'Ostrom',
    title: 'Ostrom · Agents propose. Your team decides.',
    // At most 160 characters (search snippets): the first sentence of the lead.
    description:
      "Ostrom runs a company's AI coding agents in the cloud and makes them follow the team's rules.",
  },
  a11y: {
    skipToContent: 'Skip to content',
    mainNav: 'Main',
    footerNav: 'Footer',
    home: 'Ostrom home',
    openMenu: 'Menu',
    external: '(opens in a new tab)',
  },
  nav: {
    product: 'Product',
    pricing: 'Pricing',
    docs: 'Docs',
    blog: 'Blog',
    changelog: 'Changelog',
    signIn: 'Sign in',
    startFree: 'Start free',
  },
  theme: {
    label: 'Theme',
    system: 'System',
    light: 'Light',
    dark: 'Dark',
  },
  footer: {
    motif: 'Many agents. One way out.',
    slogan: 'AI moves fast. Stay in control.',
    columns: {
      product: 'Product',
      developers: 'Developers',
      company: 'Company',
      legal: 'Legal',
    },
    links: {
      howItWorks: 'How it works',
      pricing: 'Pricing',
      changelog: 'Changelog',
      status: 'Status',
      compare: 'Compare',
      docs: 'Docs',
      api: 'API reference',
      openSource: 'Open source',
      github: 'GitHub',
      blog: 'Blog',
      security: 'Security',
      contact: 'Contact',
      terms: 'Terms',
      privacy: 'Privacy',
      dpa: 'DPA',
      cookies: 'Cookies',
      imprint: 'Legal notice',
      cookieSettings: 'Cookie settings',
    },
    copyright: '© 2026 Guimauve Digital SAS. Ostrom is a product of Guimauve Digital.',
  },
  notFound: {
    title: 'This page is not here',
    body: 'The link may be old, or the page moved. Everything else is one click away.',
    home: 'Back to the home page',
    elsewhere: 'Or go to',
  },
  home: {
    hero: {
      eyebrow: 'AI moves fast. Stay in control.',
      title: 'Agents propose. Your team decides.',
      lead: "Ostrom runs a company's AI coding agents in the cloud and makes them follow the team's rules. Every change they make leaves a receipt, and the few that matter wait for a person's yes.",
      primary: 'Start free',
      secondary: 'See how it works',
      worksWith: 'Works with Claude Code, Codex and your own models.',
    },
    vision: {
      eyebrow: 'The shift',
      title:
        'Soon every company will have more AI agents than employees. Ostrom is how people stay in charge.',
      body: 'We already live there.',
      stats: [
        { value: '4', label: 'people' },
        { value: 'up to 20', label: 'agents working in parallel' },
        { value: '142', label: 'projects run by agents' },
      ],
      note: '20 is the limit we set, 5 agents per person. Counted in our own company on 23 October 2026.',
    },
    problem: {
      eyebrow: 'The problem',
      title: 'A bad choice: slow AI down, or lose control of it.',
      body: 'AI agents now write code faster than any team can review it.',
      researchLabel: 'What the research says',
      quotes: [
        {
          text: '“Without robust control systems, an increase in change volume leads to instability.”',
          source: 'DORA (Google), 2025',
          href: 'https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report',
        },
        {
          text: '45% of merged Claude Code pull requests still needed human changes, often to meet project standards.',
          source: 'Watanabe et al., 2025',
          href: 'https://arxiv.org/abs/2509.14745',
        },
      ],
    },
    third: {
      eyebrow: 'The third option',
      title: 'Full AI speed. Full control.',
      body: "Control isn't a brake. It's what makes speed safe.",
      options: [
        { name: 'Slow AI down', verdict: 'Safe, and slow.' },
        { name: 'Let it run', verdict: 'Fast, and blind.' },
        { name: 'Ostrom', verdict: 'Fast, and you decide.' },
      ],
    },
    how: {
      eyebrow: 'How it works',
      title: 'From your rules to a yes in Slack.',
      steps: [
        {
          title: 'Your rules, read from GitHub',
          body: 'Ostrom reads your GitHub and proposes the rules your team already follows.',
        },
        {
          title: 'Agents in the cloud, under those rules',
          body: 'Your agents run in the cloud under those rules. No laptop left open, no memory limit.',
        },
        {
          title: 'A yes where it matters',
          body: 'When one wants to ship something important, the right person gets a message in Slack, with the proof, and says yes or no.',
        },
        {
          title: 'A receipt for every change',
          body: 'Every change keeps a receipt: what the agent was told, the rules it followed, who said yes.',
        },
      ],
    },
    pillars: {
      eyebrow: 'See. Steer. Prove.',
      title: 'Keep the speed, take back control.',
      body: 'Your team already runs AI agents. Keep the speed, take back control: see every agent, set the rules, approve what ships, know what it costs.',
      items: [
        {
          name: 'See',
          title: 'Every agent, every action, every dollar, visible.',
          body: 'Usage and spend across providers, per person and per team, in one place.',
        },
        {
          name: 'Steer',
          title: 'Your rules applied, your budgets, your approvals.',
          body: 'Rules enforced by the system, not only written down. A person approves only what matters.',
        },
        {
          name: 'Prove',
          title: 'A receipt for every action.',
          body: 'What the agent was told, the rules it followed, who approved it. Signed, in an open format.',
        },
      ],
    },
    receipt: {
      eyebrow: 'Prove',
      title: 'Every agent change, signed.',
      body: 'A receipt travels with each change. Anyone can check it, with or without Ostrom.',
      example: 'Example',
      rows: [
        { key: 'Told', value: '“Round invoice totals the way finance does” · Maya' },
        { key: 'Agent', value: 'Claude Code · session s_2291' },
        { key: 'Rules', value: 'Finance rounding, version 4' },
        { key: 'Checks', value: '3 passed' },
        { key: 'Approved', value: 'Maya, before the deploy' },
        { key: 'Signature', value: 'ed25519 · verified' },
      ],
    },
    approvals: {
      eyebrow: 'Few, targeted approvals',
      title: 'Rules don’t make agents smarter. They make agents follow the team.',
      body: 'A yes asked everywhere becomes a reflex. Ostrom asks a person only where it matters, with the evidence in view; everything else runs on your rules.',
      quote:
        'Rules enforced as executable checks were followed 88% of the time; the same rules as prompt text, 67%.',
      source: 'ContextCov, 2026 (preprint)',
      href: 'https://arxiv.org/abs/2603.00822',
    },
    motif: {
      label: 'Many agents. One way out: four agents converge into the gate, one signed change ships',
      title: 'Many agents. One way out.',
      agents: ['Claude Code', 'Codex', 'Self-hosted model', 'Support agent'],
      gate: 'your rules + a human yes',
      shipped: ['shipped,', 'signed'],
    },
    open: {
      eyebrow: 'Open source',
      title: 'Open source. Your models.',
      money:
        'Ostrom is open source, and every line of code is public. Companies pay per active person for our cloud, the enterprise features (unlocked by a key) and support. We never charge for the AI itself.',
      byok: 'Bring your own models. We never resell model access.',
    },
    why: {
      eyebrow: 'Why the name',
      title: 'Elinor Ostrom showed how people share what matters without chaos.',
      body: 'Elinor Ostrom won a Nobel Prize for showing how communities govern shared resources without chaos. Ostrom does that for AI agents.',
    },
    cta: {
      title: 'Speed is free now. Control isn’t.',
      primary: 'Start free',
      secondary: 'Talk to us',
    },
  },
  pricing: {
    metaTitle: 'Pricing',
    metaDescription:
      'Free for small teams. Team at $35 and Business at $65 per active person per month. We never charge for the AI itself.',
    eyebrow: 'Pricing',
    title: 'Pay for the people who decide, not for the agents.',
    lead: 'Free for up to 5 people. Paid plans are priced per active person, billed monthly or yearly.',
    intervalLabel: 'Billing',
    monthly: 'Monthly',
    yearly: 'Yearly',
    yearlySave: '−20 %',
    perPerson: 'per active person / month',
    billedYearly: 'billed yearly, {amount} per person',
    billedMonthly: 'billed monthly',
    currency: 'USD, excl. tax',
    free: 'free',
    custom: 'On request',
    popular: 'Recommended',
    plans: {
      free: {
        name: 'Free',
        tagline: 'For a small team trying Ostrom on real work.',
        cta: 'Start free',
        features: [
          'Up to 5 people',
          '5 cloud agents at a time',
          '300 agent hours a month',
          'Rules, approvals and signed receipts',
          'Receipts kept 30 days',
        ],
      },
      team: {
        name: 'Team',
        tagline: 'Your rules and approvals, for one team.',
        cta: 'Start with Team',
        features: [
          'Everything in Free, plus…',
          'As many people as you need',
          '5 cloud agents per paid person',
          '100 agent hours per paid person, pooled',
          'Receipts kept 90 days',
        ],
      },
      business: {
        name: 'Business',
        tagline: 'Several teams, shared budgets, audits.',
        cta: 'Start with Business',
        features: [
          'Everything in Team, plus…',
          'Single sign-on: OIDC and SAML',
          'Organization policies',
          '150 agent hours per paid person, pooled',
          'Receipts kept 1 year',
        ],
      },
      enterprise: {
        name: 'Enterprise',
        tagline: 'On your servers, on your terms.',
        cta: 'Talk to us',
        features: [
          'Everything in Business, plus…',
          'Self-hosted, unlocked by an enterprise key',
          'No limit on agents or hours',
          'Receipts kept as long as you need',
          'Contract, invoicing and support on your terms',
        ],
      },
    },
    // Word for word from the locked value proposition (PB-PR2).
    noAiCharge: 'We never charge for the AI itself.',
    byok: 'Bring your own models. We never resell model access.',
    allowanceNote:
      'Cloud agent and hour allowances of the paid plans can still change before general availability; we will say so here first.',
    compare: {
      title: 'Compare plans',
      feature: 'Feature',
      yes: 'Included',
      no: 'Not included',
      // PB-PR3: grouped by See / Steer / Prove / Security and admin / Support, one line under each row name, and a
      // value in every cell ('yes' is a tick, 'no' a dash).
      groups: [
        {
          name: 'See',
          rows: [
            {
              label: 'Cloud agents at a time',
              detail: 'Agents your team runs in the cloud at the same time.',
              values: ['5', '5 per paid person', '5 per paid person, 10 minimum', 'Unlimited'],
            },
            {
              label: 'Agent hours a month',
              detail: 'Cloud time for your agents, pooled across the organization.',
              values: ['300', '100 per paid person', '150 per paid person, 600 minimum', 'Unlimited'],
            },
            {
              label: 'Bring your own models',
              detail: 'Your model keys or your developers’ subscriptions; your provider bills the inference.',
              values: ['yes', 'yes', 'yes', 'yes'],
            },
          ],
        },
        {
          name: 'Steer',
          rows: [
            {
              label: 'Rules and approvals',
              detail: 'Your rules enforced by the server, and a person’s yes where it matters.',
              values: ['yes', 'yes', 'yes', 'yes'],
            },
            {
              label: 'Organization policies',
              detail: 'Rules set once for every team of the organization.',
              values: ['no', 'no', 'yes', 'yes'],
            },
          ],
        },
        {
          name: 'Prove',
          rows: [
            {
              label: 'Signed receipts',
              detail: 'What the agent was told, the rules it followed, who said yes.',
              values: ['yes', 'yes', 'yes', 'yes'],
            },
            {
              label: 'Receipt retention',
              detail: 'How long receipts stay in Ostrom Cloud.',
              values: ['30 days', '90 days', '1 year', 'Your choice'],
            },
          ],
        },
        {
          name: 'Security and admin',
          rows: [
            {
              label: 'People',
              detail: 'Everyone who launches an agent or answers an approval.',
              values: ['Up to 5', 'Unlimited', 'Unlimited', 'Unlimited'],
            },
            {
              label: 'Single sign-on (OIDC, SAML)',
              detail: 'Sign in through your identity provider.',
              values: ['no', 'no', 'yes', 'yes'],
            },
            {
              label: 'Self-hosting with an enterprise key',
              detail: 'Ostrom on your servers, with the enterprise features unlocked.',
              values: ['no', 'no', 'no', 'yes'],
            },
          ],
        },
        {
          name: 'Support',
          rows: [
            {
              label: 'Help',
              detail: 'Where you get answers when you are stuck.',
              values: [
                'Docs and community',
                'From the team, in the console',
                'From the team, in the console',
                'On your terms',
              ],
            },
          ],
        },
      ],
    },
    faq: {
      title: 'Questions',
      items: [
        {
          question: 'Who counts as an active person?',
          answer:
            'Everyone who launched an agent or answered an approval during the billing period. People who only read receipts are free.',
        },
        {
          question: 'Do you charge for the AI?',
          answer:
            'No. You bring your own model keys or use your developers’ subscriptions; your provider bills the inference. We never resell model access.',
        },
        {
          question: 'Can we run Ostrom ourselves?',
          answer:
            'Yes. Ostrom is open source and self-hosts with Docker or Helm. The enterprise features need a license key: talk to us.',
        },
        {
          question: 'How does yearly billing work?',
          answer:
            'You commit to a number of people for the year and pay up front, 20% below the monthly price. Monthly plans are billed at the end of each month for the active people of that month.',
        },
        {
          question: 'Are taxes included?',
          answer: 'Prices are in US dollars, before tax. Sales tax or VAT is added where it is due.',
        },
      ],
    },
  },
  consent: {
    title: 'Cookie choice',
    body: 'May we measure how this site is used, with PostHog (EU), to improve it? Nothing is measured unless you accept.',
    policy: 'Cookie policy',
    accept: 'Accept',
    refuse: 'Refuse',
    settings: 'Cookie settings',
  },
  pages: {
    draftBanner: 'Draft, to be validated (à valider). This text is not in force yet.',
    updated: 'Last updated {date}',
    onThisPage: 'On this page',
  },
  legal: {
    metaTitle: 'Legal',
    metaDescription: 'Legal notice, terms, privacy, data processing and cookies of Ostrom.',
    eyebrow: 'Legal',
    title: 'Legal',
    lead: 'The notice, the contracts and the policies that apply to ostrom.run and Ostrom Cloud.',
  },
  blog: {
    metaTitle: 'Blog',
    metaDescription: 'News and essays from the team building Ostrom.',
    eyebrow: 'Blog',
    title: 'Notes from the people building Ostrom',
    lead: 'What we ship, what we learn running our own company with agents, and why.',
    empty: 'The first post arrives with the public launch.',
    draft: 'Draft',
    by: 'By {author}',
    back: 'All posts',
  },
  changelog: {
    metaTitle: 'Changelog',
    metaDescription:
      'Every release of Ostrom: the CLI, the server, the console, the mobile app and the core.',
    eyebrow: 'Changelog',
    title: 'What shipped',
    lead: 'Every release of Ostrom, newest first, straight from the GitHub releases of each repository.',
    empty: 'The first releases arrive with the public launch.',
    view: 'Release on GitHub',
  },
  security: {
    metaTitle: 'Security',
    metaDescription:
      'How Ostrom is built to keep AI agents under your control: threat model, signed receipts, data isolation and responsible disclosure.',
    eyebrow: 'Security',
    title: 'Security is the product.',
    lead: 'We sell control over AI agents. Our own controls are the first ones you should check, so here they are.',
    threatTitle: 'Threat model',
    threatLead:
      'What we design against, and what Ostrom does about it. Each rule is enforced by the server, not by the agent.',
    threats: [
      {
        threat: 'An agent ships without the yes it needs',
        answer:
          'Approvals are enforced by the server. An agent’s token only reaches its own session: it cannot mark its checks as passed, approve its own request, or close another session.',
      },
      {
        threat: 'Someone approves in another person’s place',
        answer:
          'A yes needs a signed-in person. The one who asked cannot approve their own request, unless they are the only approver declared, and the receipt says so. An admin never answers in an approver’s place.',
      },
      {
        threat: 'The person approves one thing and another ships',
        answer:
          'The changes shown to the approver are computed by the server from GitHub, never from a local copy. The yes is bound to the repository, the commit and the exact list of commits shown, and can be used once.',
      },
      {
        threat: 'A command slips past the rules',
        answer:
          'Commands are parsed the way the tools read them: options before the verb, another repository or remote, an implicit push to main. A yes for a push does not cover a force-push.',
      },
      {
        threat: 'One company sees another’s data',
        answer:
          'Every row carries its organization, and the database itself enforces the isolation with row-level security. Each resource has a test proving another organization cannot see it.',
      },
      {
        threat: 'A model key or a secret leaks',
        answer:
          'Your model keys and secrets are encrypted, never written to logs or prompts, and only released to the session that needs them.',
      },
    ],
    receiptsTitle: 'Signed receipts',
    receiptsBody:
      'Every change an agent makes leaves a receipt: what it was told, the rules and checks that applied, who approved it and what they saw. Receipts are signed with Ed25519 over a canonical form, in an open format, so anyone can check one without trusting us.',
    platformTitle: 'How we run it',
    platform: [
      'Hosted in Switzerland, TLS everywhere, HSTS on every domain.',
      'Single sign-on with OIDC or SAML on Business and Enterprise; sign-in without passwords on every plan.',
      'Open source: every line of the product can be read and audited, and self-hosted.',
      'Tests on every change, end to end, before anything merges.',
    ],
    disclosureTitle: 'Report a vulnerability',
    disclosureBody:
      'Write to {email} with the steps to reproduce. We answer within two business days, keep you informed until it is fixed, and credit you if you wish.',
    disclosureRules: [
      'Test only with accounts and data that are yours.',
      'Do not degrade the service, and do not access or keep other people’s data.',
      'Give us a reasonable time to fix before you publish.',
    ],
    safeHarbor: 'If you follow these rules in good faith, we will not take legal action against you.',
  },
  openSource: {
    metaTitle: 'Open source',
    metaDescription:
      'Ostrom is open source: the core and the CLI under Apache 2.0, the server, console and app under the AGPL, enterprise features behind a key.',
    eyebrow: 'Open source',
    title: 'Every line of code is public.',
    lead: 'Ostrom is open source, and every line of code is public. Companies pay per active person for our cloud, the enterprise features (unlocked by a key) and support. We never charge for the AI itself.',
    reposTitle: 'Repositories and licenses',
    repository: 'Repository',
    what: 'What it is',
    license: 'License',
    repos: [
      {
        name: 'ostrom-core',
        what: 'Protocol, signed receipts, workflow model and API contract, shared by everything else.',
        license: 'Apache 2.0',
      },
      { name: 'ostrom-cli', what: 'The ostrom command for macOS, Linux and Windows.', license: 'Apache 2.0' },
      {
        name: 'ostrom-server',
        what: 'The server: sessions, approvals, receipts, organizations, billing.',
        license: 'AGPL 3.0, ee/ commercial',
      },
      { name: 'ostrom-web', what: 'The console in the browser.', license: 'AGPL 3.0, ee/ commercial' },
      {
        name: 'ostrom-app',
        what: 'The mobile app, to approve from anywhere.',
        license: 'AGPL 3.0, ee/ commercial',
      },
    ],
    modelTitle: 'How the licenses work',
    model: [
      {
        title: 'Apache 2.0 for what you embed',
        body: 'The core and the CLI can go anywhere, inside your own tools too, with no obligation beyond the notice.',
      },
      {
        title: 'AGPL for what runs as a service',
        body: 'Run the server, console and app for your company as much as you like. If you offer a modified version to others over a network, share your changes.',
      },
      {
        title: 'ee/ for the enterprise features',
        body: 'Single sign-on, policies, audits and the other enterprise features live in an ee/ folder: the code is public, using it in production needs a license key.',
      },
    ],
    contribute:
      'Issues and pull requests are welcome on GitHub. Security reports go to {email}, not to a public issue.',
  },
  compare: {
    metaTitle: 'Compare',
    metaDescription:
      'How Ostrom relates to agent vendors, cloud agents, AI gateways, review bots and doing it yourself.',
    eyebrow: 'Compare',
    title: 'Where Ostrom fits.',
    lead: 'Ostrom does not replace your agents: it runs the ones you already use, under your rules. Here is how it relates to the tools around it, including when they are the better choice.',
    them: 'What they do well',
    us: 'What Ostrom adds',
    choose: 'Choose them alone when',
    items: [
      {
        name: 'Agent vendors’ team plans',
        examples: 'Claude Code, Codex',
        them: 'The best agents, with the admin settings of their own vendor.',
        us: 'One set of rules, approvals and receipts across every vendor and your own models, with your keys.',
        choose: 'Your whole team uses one vendor and its settings cover the rules you need.',
      },
      {
        name: 'Cloud coding agents',
        examples: 'hosted agents that open pull requests for you',
        them: 'Agents that work in their cloud, end to end, with little setup.',
        us: 'The agents your team already uses, in the cloud, under your team’s rules, with a person’s yes where it matters; open source and self-hostable.',
        choose: 'You want one vendor’s agent to take tickets on its own, and its review flow is enough.',
      },
      {
        name: 'AI gateways',
        examples: 'model routers and spend proxies',
        them: 'Route model calls, cache them, and track spend per key.',
        us: 'Control over what agents do, not only which model they call: actions, approvals, receipts, alongside the spend.',
        choose: 'Your concern is model cost and routing, not what the agents change.',
      },
      {
        name: 'Review bots',
        examples: 'AI pull request reviewers',
        them: 'Comment on pull requests after the change is written.',
        us: 'Rules applied while the agent works, and approvals bound to the exact commits shown. Ostrom works alongside your review bot.',
        choose: 'People write most of your code and you want a second pair of eyes.',
      },
      {
        name: 'Doing it yourself',
        examples: 'AGENTS.md, CI checks, scripts',
        them: 'Free, flexible, and close to your code.',
        us: 'The same rules enforced for every agent and every person, approvals in Slack, and a receipt for each change, without maintaining the glue.',
        choose: 'You have one repository, a few agents, and time to maintain the scripts.',
      },
    ],
  },
  status: {
    metaTitle: 'Status',
    metaDescription: 'Live status of the Ostrom website, console and API.',
    eyebrow: 'Status',
    title: 'System status',
    lead: 'Checked from your browser, now and every minute.',
    checking: 'Checking',
    operational: 'Operational',
    unreachable: 'Unreachable',
    components: { site: 'Website', console: 'Console', api: 'API' },
    checkedAt: 'Last check {time}',
    help: 'Something looks wrong? Write to {email}.',
  },
  approval: {
    example: 'Example',
    heading: 'Agents propose. Your team decides.',
    waiting: 'Waiting for your decision',
    waitingFor: '4 min',
    step: 'Step 4 of 5 · release',
    title: 'Ship the new checkout to all customers',
    agent: 'release-agent · Claude Code',
    message: "Tests pass and staging ran clean. I'll release to 5% first and roll back if errors rise.",
    proofsLabel: 'Proof the agent attached',
    proofs: [
      { label: 'Tests pass', detail: '2 min ago' },
      { label: 'Review: nothing blocking', detail: '2 rounds' },
      { label: 'Staging proof attached', detail: '41 s run' },
    ],
    commits: '3 commits · 7c1e9a4',
    approve: 'Approve and ship',
    sendBack: 'Send back',
    approved: 'Approved by you · on the receipt',
    sentBack: 'Sent back to the agent · on the receipt',
    receipt: 'Receipt signed · ed25519 · 7c1e9a4',
    undo: 'Undo',
    caption: 'Your yes goes on the receipt, with the rules the agent followed.',
  },
} as const satisfies MessageTree

interface MessageTree {
  readonly [key: string]: string | MessageTree | readonly MessageTree[] | readonly string[]
}

// Keeps the shape (tuples stay tuples, so every language has the same number of items) and widens the texts.
type Widen<T> = T extends string ? string : { readonly [K in keyof T]: Widen<T[K]> }

/** The shape every language must fill. */
export type Messages = Widen<typeof en>
