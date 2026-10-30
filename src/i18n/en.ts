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
  docs: {
    title: 'Docs',
    description:
      'Guides and reference for Ostrom: run AI coding agents under your rules, approve what ships, check every receipt.',
    home: {
      title: 'Ostrom documentation',
      lead: 'The guides are on their way, written from the code that ships. The API reference fills in as the server answers each endpoint.',
      api: 'API reference',
    },
    nav: {
      label: 'Docs',
      menu: 'Docs menu',
      breadcrumb: 'Breadcrumb',
      pager: 'More pages',
      previous: 'Previous',
      next: 'Next',
      toc: 'On this page',
    },
    status: {
      partial: 'Partial',
      comingSoon: 'Coming soon',
    },
    code: {
      copy: 'Copy',
      copied: 'Copied',
      failed: 'Copy failed',
    },
    versions: {
      label: 'Version',
      archived: 'You are reading the docs of {label}.',
      latest: 'Read the latest docs',
    },
    search: {
      button: 'Search docs',
      dialog: 'Search the docs',
      placeholder: 'Search the guides and the API',
      close: 'Esc',
      closeLabel: 'Close the search',
      results: 'Results',
      loading: 'Loading the index…',
      failed: 'The search index could not be loaded. Try again in a moment.',
      empty: 'Type to search every page and every endpoint.',
      noResults: 'No results for “{query}”.',
      count: '{count} results',
      hint: '↑ ↓ to move · Enter to open · Esc to close',
    },
    api: {
      title: 'API reference',
      description:
        'Every endpoint of the Ostrom API, generated from its OpenAPI description, with a curl example to copy.',
      missing:
        'The OpenAPI description of the API is not in this build yet. This reference fills in as soon as it is.',
      notServed:
        'This reference lists only the endpoints the Ostrom server already answers. None is live yet: each one appears here the day it ships.',
      overview: 'Overview',
      schemas: 'Schemas',
      schemasDescription: 'Every object the Ostrom API sends or receives, with its fields.',
      tagDescription: 'The {tag} endpoints of the Ostrom API.',
      version: 'Version {version}',
      baseUrl: 'Base URL',
      baseUrlBody:
        'Ostrom Cloud answers on the URL below. A self-hosted server serves the same API on its own host.',
      servers: 'Servers in the contract',
      authentication: 'Authentication',
      authenticationBody:
        'Send an Ostrom token (from the CLI, a browser session or a service key) in the Authorization header of every request. The examples read it from $OSTROM_TOKEN.',
      errors: 'Errors',
      errorsBody: 'Every refusal has the same JSON body. These status codes appear in the API:',
      resources: 'Resources',
      endpoints: '{count} endpoints',
      parameters: 'Parameters',
      body: 'Request body',
      responses: 'Responses',
      required: 'required',
      nullable: 'nullable',
      deprecated: 'deprecated',
      public: 'No token needed',
      defaultValue: 'Default:',
      values: 'One of:',
      additional: 'Any other key:',
      children: 'Show {count} fields',
      request: 'curl',
      response: 'Response {status}',
    },
  },
} as const satisfies MessageTree

interface MessageTree {
  readonly [key: string]: string | MessageTree | readonly MessageTree[] | readonly string[]
}

// Keeps the shape (tuples stay tuples, so every language has the same number of items) and widens the texts.
type Widen<T> = T extends string ? string : { readonly [K in keyof T]: Widen<T[K]> }

/** The shape every language must fill. */
export type Messages = Widen<typeof en>
