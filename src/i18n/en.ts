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
      cookieSettings: 'Cookie settings',
    },
    copyright: '© 2026 Guimauve Digital SAS. Ostrom is a product of Guimauve Digital.',
  },
  notFound: {
    title: 'This page is not here',
    body: 'The link may be old, or the page moved. Everything else is one click away.',
    home: 'Back to the home page',
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
    yearlySave: '−20%',
    perPerson: 'per active person / month',
    billedYearly: 'billed yearly, {amount} per person',
    free: 'free',
    custom: 'Custom',
    popular: 'Most teams start here',
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
          'Everything in Free',
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
          'Everything in Team',
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
          'Everything in Business',
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
      rows: [
        { label: 'People', values: ['Up to 5', 'Unlimited', 'Unlimited', 'Unlimited'] },
        {
          label: 'Cloud agents at a time',
          values: ['5', '5 per paid person', '5 per paid person, 10 minimum', 'Unlimited'],
        },
        {
          label: 'Agent hours a month',
          values: ['300', '100 per paid person', '150 per paid person, 600 minimum', 'Unlimited'],
        },
        { label: 'Bring your own models', values: ['yes', 'yes', 'yes', 'yes'] },
        { label: 'Rules, approvals, signed receipts', values: ['yes', 'yes', 'yes', 'yes'] },
        { label: 'Receipt retention', values: ['30 days', '90 days', '1 year', 'Your choice'] },
        { label: 'Single sign-on (OIDC, SAML)', values: ['no', 'no', 'yes', 'yes'] },
        { label: 'Organization policies', values: ['no', 'no', 'yes', 'yes'] },
        { label: 'Self-hosting with an enterprise key', values: ['no', 'no', 'no', 'yes'] },
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
