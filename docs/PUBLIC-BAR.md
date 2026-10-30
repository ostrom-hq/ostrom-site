# The public bar

Everything a stranger can see — the site at `ostrom.run`, the docs, pricing, changelog, blog, the open source
page, the console's sign-in screens, the app's store pages and the repositories' front pages — is held to the
level of the best developer companies. This file says what that level is, page by page, and turns it into a
checklist a pull request can be checked against.

- **Who uses it.** Anyone opening a pull request that changes a public page (site, docs, console screens a
  signed-out person can reach, app store listing). The reviewer cites the item IDs (`PB-…`) that fail.
- **How it was made.** On 30 October 2026 we captured and measured 82 pages of 17 companies (desktop and
  mobile, light and dark), ran axe on landings, docs and pricing pages, and read their docs the way a new user
  would. The captures and raw measures are kept privately with the research (`research/public-bar/` in the
  research repository); every claim below that starts with "measured" comes from that run. Links point to the
  live pages, which may have changed since.
- **What wins when rules disagree.** The locked value proposition (wording, numbers, banned words) first, then
  the Signal brand (`tokens.css`), then this file. Ostrom's own `CONVENTIONS.md` governs code; this file governs
  what the code shows.

The references, chosen by Lyes: Linear, Notion, Stripe (site, docs, changelog), Vercel, Supabase, PostHog,
Resend, Cal.com, Dub, Tailscale, Biome, Bun, Astral (uv, ruff), Raycast, Zed, and the docs engines Mintlify and
Fumadocs.

---

## 1. What the best do that everyone notices

Five things separate the reference sites from the merely tidy ones. They are the spirit of every rule below.

1. **The product is the hero.** Linear's first screen is Linear itself, a real issue with real activity, not an
   illustration. Resend shows the code you would write, Bun and Astral show the benchmark chart, Supabase shows
   its products as cards. Nobody leads with stock art or an abstract 3D object (Vercel's triangle is the
   exception, and it is their logo).
2. **One sentence, then proof.** The headline is short and concrete (Linear: "The product development system for
   teams and agents"; Supabase: "Build in a weekend. Scale to millions"), the line under it says how, and proof
   follows within one scroll: logos, a number, a customer quote, or the product moving.
3. **Docs you can paste from.** Stripe, Supabase, Resend and Astral: every command and snippet has a copy
   button, the language or OS choice is a tab that remembers itself, and the quickstart ends on something that
   works. Stripe even puts your own test key into the samples once you are signed in.
4. **Fast and still.** Measured: 13 of the 17 reference landings reach their largest paint under 0.8 s on a
   desktop connection (the slow ones: Biome 2.4 s, Linear 1.6 s, Zed 1.3 s, Fumadocs 1.1 s), and most do not shift (CLS 0 on
   Linear, Vercel, Bun, Cal.com, Dub, Resend). The misses are instructive: Tailscale's landing shifts by 0.289,
   Raycast's pricing by 0.483, Stripe's quickstart by 0.199. Motion is used to explain (Stripe's gradient,
   Linear's product scenes), never to make you wait.
5. **Honest edges.** A real 404 page (Stripe returns HTTP 404 with search and links), a status page linked from
   the footer, a changelog with dates, prices with units and a comparison table. Where the best fall short is
   exactly here too (see the "what is wrong" notes): Linear and Vercel answer an unknown URL with their login
   screen and HTTP 200; none of the measured landings passes axe without a serious finding.

Ostrom's job is to match the first four and beat everyone on the fifth.

---

## 2. Rules that apply to every public page

### 2.1 Words

- **PB-W1.** Marketing sentences come word for word from the locked value proposition: headline "Agents propose.
  Your team decides.", second screen "Every agent change, signed.", the two sentences of the YC description,
  the slogans, the money and open source sentences. A change of wording needs Lyes's agreement.
- **PB-W2.** Outside the docs and the "For engineers" section, none of these words appear: harness, control
  plane, MCP, hooks, git blame, skills, platform, guardrails, meta-harness, software factory. (Docs and API pages
  may use them, defined on first use.) "For engineers" means the developer pages (docs, changelog, open source,
  security, engineering blog posts) and, on a marketing page, the element marked `data-audience="engineers"`. The
  jargon scan therefore covers the visible text of the marketing pages (home, pricing, company pages, non-engineering
  posts) outside that element.
- **PB-W3.** No number without a source. Allowed on public pages: our own verified numbers (4 people, up to 20
  agents in parallel, 142 projects run by agents) and the research sentences listed as public in the value
  proposition, each with its short source in small type. Never an "X× better". A missing number is left out, not
  estimated.
- **PB-W4.** Nothing is described as available before it ships. Docs use the `status` front matter (`available`,
  `partial`, `coming-soon`) and show it; the site uses "Coming soon" labels the same way. Cloud, enterprise
  features, integrations: check the code on `main` before writing "you can".
- **PB-W5.** Titles say what is on the page, in sentence case ("Approve a push to main", not "Approvals Overview").
  Headings are understandable alone (Linear, Stripe). No exclamation marks in headings or titles, and none of
  "simply", "just", "easily" in an instruction (docs, buttons).
- **PB-W6.** English first. A French version, when it comes, is a full translation with `hreflang`, never a mix.

### 2.2 Type

The Signal brand sets the faces; the best sites set the discipline.

| | Linear | Vercel | Stripe | Notion | Ostrom rule |
|---|---|---|---|---|---|
| Landing H1, desktop (measured) | Inter 64 px / 510 / −1.4 px | Geist 64 px / 400 / −3.84 px | Söhne 40 px / 300 | Inter 96 px / 600 / −4.6 px | Archivo 125 % width, 800, −0.03 em, 64–96 px |
| Body | 16 / 24 | 16 / 24 | 16–18 | 16 | 16 / 26 (docs 16 / 28) |
| Mono | Berkeley Mono | Geist Mono | Söhne Mono | — | Azeret Mono |
| Font files on the landing (measured) | 1 (variable) | 2 | 2 | 2 | ≤ 2 on an English page |

- **PB-T1.** Two families only: Archivo (display and text) and Azeret Mono (code, figures in tables, receipts). Self
  hosted, `woff2`, one variable file per family and subset (latin, and latin-ext declared with its `unicode-range`
  so it downloads only when a page needs it: an English page loads two files, at most four exist), loaded with
  `next/font` so the fallback has matching metrics (no shift when the font arrives). Never a request to Google
  Fonts.
- **PB-T2.** One display style: Archivo at 125 % width, weight 800, tracking −0.03 em, `text-wrap: balance`. H1
  64 px desktop / 40 px mobile on the landing (96 px only for a single-line hero), 40 px on inner pages.
  Measured: Bun's landing, blog and docs set their headings in Archivo 800 too (68 px, −0.02 em). The 125 % width
  is what keeps Ostrom from looking like Bun: never ship the display face at normal width, and check that the
  `wdth` axis is really in the subset file (a subset without it silently falls back to 100 %).
- **PB-T3.** Long-form text (landing sections, docs, blog, changelog, legal) is set in a column whose maximum width
  gives 60 to 75 characters per line (`--measure: 64ch` for prose, 72 ch in docs; `ch` taken in the text face at its
  normal width). Short texts (card blurbs, captions, table cells) are free. Measured on Biome's landing: paragraphs
  1 080 px wide — exactly what not to do.
- **PB-T4.** Numbers in prices, tables, receipts and benchmarks use `font-variant-numeric: tabular-nums`.
- **PB-T5.** Uppercase labels only for eyebrows and table headers, with `--label-tracking` (0.08 em).

### 2.3 Colour

- **PB-C1.** Every colour comes from `tokens.css`. No hex value in a component.
- **PB-C2.** Garnet (`--signal`) means "a person is awaited": the gate, the approve button, the one primary action
  of a screen (`tokens.css`). At most one garnet button per viewport, everywhere, site included. Every other action
  uses the neutral button (ink on paper, paper on ink). In practice: on a page whose first screen has its own
  primary action (the landing hero), the header's action is neutral; on pricing, only the recommended plan's action
  is garnet; in the console, only the approve button. Amber is warning, red is error; garnet is never either.
- **PB-C3.** Light and dark are both first class. The default follows the system; a three-way switch (System,
  Light, Dark) sits in the footer (Vercel does this) and is remembered; the stored choice is applied before the
  first paint (inline script in `<head>`, no flash). Linear ships dark only and Stripe light only: Ostrom ships
  both because the console and the docs are read for hours.
- **PB-C4.** Contrast: 4.5:1 for text, 3:1 for large text, icons and borders that carry meaning, in both themes.
  Measured: Linear's landing has 16 contrast failures, Vercel's docs 2. Ostrom ships with none.

### 2.4 Layout and grid

- **PB-L1.** Content grid: 12 columns, 24 px gutter, max 1 200 px (`--grid-max`); 16 px side margin on mobile, 24 px
  from 768 px. Sections separated by `--space-9` (96 px) desktop, `--space-8` (64 px) mobile.
- **PB-L2.** No horizontal scroll at 320 px. Tables and code scroll inside their own box.
- **PB-L3.** Docs use three columns from 1 280 px: navigation (240–280 px), content (≤ 72 ch), "On this page"
  (200–240 px); two columns from 1 024 px (the table of contents folds into the top of the page); one below.
- **PB-L4.** The header is sticky, 56–64 px tall (measured: Linear 72, Biome 64, Vercel 64), with a translucent
  background that keeps text readable when content scrolls under it.

### 2.5 Motion

- **PB-M1.** Motion explains a change of state; it never delays reading. The signature motion is the diaphragm:
  closed while an agent proposes, opening (`--dur-open` 820 ms, `--ease-open`) on a person's yes. It is used for
  that meaning only.
- **PB-M2.** Only `transform` and `opacity` animate. No animation moves layout, so CLS stays 0.
- **PB-M3.** `prefers-reduced-motion: reduce` shows the final frame of every animation, and auto-playing scenes
  stop. A scene that loops has a pause control (WCAG 2.2.2).
- **PB-M4.** No scroll-jacking, no parallax on text, no cursor effects.

### 2.6 Performance

Budgets, checked by Lighthouse CI on the static build (mobile profile) and by the weight check in CI:

| Page | Lighthouse perf | LCP (mobile, simulated) | CLS | JS shipped (gzip) | Total weight first load |
|---|---|---|---|---|---|
| Landing | ≥ 95 | ≤ 1.8 s | ≤ 0.01 | ≤ 150 KB | ≤ 600 KB (video excluded, lazy) |
| Docs page | ≥ 95 | ≤ 1.5 s | ≤ 0.01 | ≤ 200 KB (search index lazy) | ≤ 450 KB |
| Pricing, changelog, blog | ≥ 95 | ≤ 1.8 s | ≤ 0.01 | ≤ 150 KB | ≤ 600 KB |

Why these numbers: the React and Next.js runtime alone is about 100 KB gzip, so 150 KB leaves room for the page's
own islands and nothing else. Measured on the 17 reference landings (mobile, cold cache, bytes on the wire,
appendix): JavaScript from almost none to 3.9 MB, total weight from 0.3 to 7.4 MB. Linear, Stripe and Vercel ship
1.2 to 1.4 MB of JavaScript each. The lightest are Biome (built with Astro: almost no JavaScript, 0.3 MB in total),
Bun (0.4 MB of JavaScript, 0.7 MB in total) and Fumadocs (0.6 MB, 1.3 MB). Those are the models: a static site has
no reason to come near the others, and being several times lighter is an easy, visible lead.

- **PB-P1.** The pages above meet their budget, and a pull request that crosses one fails CI: `lhci` asserts the
  scores, `largest-contentful-paint`, `cumulative-layout-shift`, `total-byte-weight` and the script size on the
  mobile profile. (The scaffold's `lighthouserc.cjs` asserts the four category scores at 0.95 only; the budget
  assertions and accessibility, best practices and SEO at 1 are to be added by SITE.)
- **PB-P2.** Images: AVIF or WebP with a PNG/JPEG fallback only where needed, explicit `width` and `height`,
  `loading="lazy"` below the first screen, `fetchpriority="high"` on the LCP image. The static export sets
  `images.unoptimized`, which turns Next.js's image optimisation off: a build step (a `sharp` script run before
  `next build`) writes the AVIF/WebP variants and widths, and a small `<picture>` component picks them. No image is
  served at its source size.
- **PB-P3.** Video: muted, `playsinline`, a poster frame, loaded only when it enters the viewport, ≤ 2 MB per clip;
  never the LCP element.
- **PB-P4.** No third-party script on the critical path. Analytics (PostHog) loads after `load`, cookieless, so the
  site needs no cookie banner (Notion and Stripe show one on first visit from Europe, covering their hero).
- **PB-P5.** Static assets are fingerprinted and cached for a year; HTML is revalidated. Brotli or gzip on every
  text response.

### 2.7 Accessibility

- **PB-A1.** axe (WCAG 2.0/2.1/2.2 A and AA) reports zero violations on every public page, in both themes. It runs
  in the Playwright e2e suite. Measured: every reference landing we could test had at least one serious finding
  (Linear: contrast, unnamed button and link; Vercel: `meta-viewport` blocking zoom; Notion: missing ARIA
  attribute, malformed lists). This is where Ostrom is better than all of them.
- **PB-A2.** A "Skip to content" link is the first focusable element (Linear, Stripe docs, Vercel have one).
- **PB-A3.** Every interactive element is reachable and usable by keyboard, with a visible focus ring
  (`--focus`, 2 px, offset 2 px). Menus close on Escape and return focus.
- **PB-A4.** Touch targets are at least 24 × 24 px (WCAG 2.5.8), 44 × 44 px for the primary actions on mobile.
- **PB-A5.** The page can be zoomed: never `maximum-scale` or `user-scalable=no` in the viewport tag.
- **PB-A6.** Decorative SVG has `aria-hidden="true"`; meaningful SVG (the diaphragm in a scene, diagrams) has a
  title or a text equivalent. Videos have captions or a transcript when they carry speech.
- **PB-A7.** One `h1` per page; headings never skip a level.

### 2.8 Search engines and sharing

- **PB-S1.** Title pattern `<Page> · Ostrom` (home: `Ostrom · Agents propose. Your team decides.`), ≤ 60 characters.
- **PB-S2.** Meta description unique per page and at most 160 characters: 70–160 on marketing pages, one sentence
  of 30–160 on docs pages (the front matter `description`, which is also the line under the title). The YC
  description is 186 characters; on the home page, use its first sentence or a shortened form agreed with Lyes, and
  keep the full text in the page.
- **PB-S3.** Canonical URL set by each page, never inherited from the root layout (a layout-level canonical makes
  the 404 and every new page point at the home page); trailing-slash form identical to the static export's URLs.
- **PB-S4.** Open Graph and Twitter card (`summary_large_image`) on every page, with a 1 200 × 630 image. The home page
  has a designed image; docs, changelog and blog pages have generated ones (title, section, brand mark), rendered at
  build time.
- **PB-S5.** JSON-LD: `Organization` and `SoftwareApplication` on the home page, `BreadcrumbList` and `TechArticle`
  on docs, `BlogPosting` on posts.
- **PB-S6.** `sitemap.xml`, `robots.txt`, RSS (or Atom) for the changelog and the blog, `/.well-known/security.txt`.
- **PB-S7.** Until Lyes gives the go, every response of every deployed environment carries `X-Robots-Tag: noindex,
  nofollow`, and `robots.txt` lets crawlers in (a crawler kept out by `Disallow` never sees the header and can still
  list the bare URL) but names no sitemap. The switch to indexable is one setting (`indexable`), flipped on launch
  day, and tested both ways on the header.

### 2.9 Machines are readers too

The best docs now serve agents as well as people (Stripe, Vercel, every Mintlify site such as Resend, Dub and Cal.com,
and Fumadocs out of the box). For a product that runs AI agents, this is not optional.

- **PB-AI1.** `/llms.txt` (index of the docs with one line per page) and `/llms-full.txt` (all docs as Markdown) are
  generated at build time.
- **PB-AI2.** Every docs page is also served as Markdown at its path without the trailing slash plus `.md`
  (`/docs/receipts/format/` → `/docs/receipts/format.md`; the docs home → `/docs.md`), written by the postbuild step
  next to the HTML and served by nginx as `text/markdown; charset=utf-8` with `X-Robots-Tag: noindex` and a
  `Link: <…/docs/receipts/format/>; rel="canonical"` header, so the HTML page stays the one indexed. The page has a
  "Copy page" button (Markdown to clipboard) with "Open in ChatGPT" and "Open in Claude" next to it.
- **PB-AI3.** Code blocks in the Markdown output keep their language and their `test` meta stripped.

---

## 3. Page by page

For each type of page: what the best do (with what is good and what is not), then the rules Ostrom applies.
Capture names refer to the private capture set (`<site>-<page>-<variant>.jpg`).

### 3.1 Header and footer

**The references**

- **Vercel** ([vercel.com](https://vercel.com/), capture `vercel-landing-desktop-light`). Good: few top-level items
  (Products, Resources, Enterprise, Pricing), menus with descriptions, a right-click on the logo offers the brand
  assets, a footer with a live "All systems normal" status dot and a theme switch. Not so good: the footer has 81
  links, too many to scan.
- **Linear** ([linear.app](https://linear.app/), `linear-landing-desktop-light`). Good: six items, "Log in" quiet
  and "Sign up" as the only filled button; footer in five short columns, including Method, Quality and Brand pages
  that show how the company works. Not so good: no theme choice, no status link in the header.
- **Supabase** ([supabase.com](https://supabase.com/), `supabase-landing-desktop-light`). Good: GitHub link with the
  live star count right in the header (social proof for an open source product), "Sign in" and "Start your project"
  side by side. Not so good: two product mega-menus that repeat each other.

**Ostrom rules**

- **PB-H1.** Header: logo (home), at most six links (Product, Docs, Pricing, Changelog, Blog, and Open source
  once the repositories are public; a link appears only when its page exists), then "Sign in" (quiet) and one
  action: "Start free" once the console takes sign-ups, "Become a design partner" before. It is neutral when the
  page's first screen has its own primary action (PB-C2).
- **PB-H2.** The GitHub link with the star count appears only once the repositories are public (Lyes's go). Until
  then no link to a private repository appears anywhere on the site. This is its own setting (`reposPublic`),
  separate from `indexable` (PB-S7): the two goes may not come on the same day.
- **PB-H3.** The mobile menu is a full-height sheet, opens from a real button with `aria-expanded`, traps focus,
  closes on Escape and on navigation.
- **PB-H4.** Footer: four columns (Product, Developers, Company, Legal), each at most seven links; theme switch;
  status dot linking to the status page once it exists; copyright line with the legal entity.
- **PB-H5.** Developers column: Docs, Quickstart, CLI reference, API reference, Changelog, then Status once the
  status page exists (PB-ST1) and GitHub once the repositories are public (PB-H2).

### 3.2 Landing

**The references**

- **Linear** ([linear.app](https://linear.app/), `linear-landing-desktop-full`). Good: headline of nine words, one
  line under it, then the product itself in the first screen, then logos. Each later section is one idea with a
  real product scene. Not so good: dark only; 16 contrast failures; on mobile 27 tap targets under 24 px.
- **Stripe** ([stripe.com](https://stripe.com/), `stripe-landing-desktop-full`). Good: a live counter of payment
  volume as proof in the first screen; one gradient that is the brand; every section ends with a link to the docs
  of what it shows. Not so good: the page is localised by IP without asking (we got French with an English
  browser), and a cookie banner covers part of the first screen in Europe.
- **Supabase** ([supabase.com](https://supabase.com/), `supabase-landing-desktop-full`). Good: "Build in a weekend,
  Scale to millions" says who it is for and why; two actions ("Start your project", "Request a demo") serve the
  developer and the buyer; product cards with tiny live demos; a wall of tweets from real developers. Not so good:
  long, and the product grid is dense on mobile.

Also worth taking: Resend (the hero is the code you will write, with a copy button), Bun and Astral (the
benchmark chart is the argument), PostHog (personality and full transparency, at the cost of density).

**Ostrom rules**

- **PB-LD1.** First screen, in this order: eyebrow ("AI moves fast. Stay in control."), H1 "Agents propose. Your
  team decides.", the two sentences, one primary and one secondary action, and the approval scene (an agent's
  push waits; the right person sees the diff and says yes; the diaphragm opens; a receipt appears). The scene is
  the product, drawn from real console components, not an illustration.
- **PB-LD2.** Within the next screen: "Every agent change, signed." with a real receipt (verifiable: link to the
  receipt format page and to a downloadable example).
- **PB-LD3.** Proof: our own operation ("4 people, up to 20 agents in parallel, 142 projects run by agents"), with
  the date of the count. Customer logos only with written permission; no logo wall before then.
- **PB-LD4.** See / Steer / Prove as three sections, each with one product scene and one link to its docs.
- **PB-LD5.** Pricing teaser: the four plans in one line each and "We never charge for the AI itself." linking to
  /pricing.
- **PB-LD6.** "For engineers" section: how it works under the hood (CLI, server, receipts, self-hosting) with an
  install command in a copyable block — only once the CLI ships; until then, a link to the receipt format.
- **PB-LD7.** Closing call to action repeats the primary action with the slogan.
- **PB-LD8.** Mobile: the scene is visible in the first 1.5 screens, not pushed below six paragraphs.

### 3.3 Pricing

**The references**

- **Linear** ([linear.app/pricing](https://linear.app/pricing), `linear-pricing-desktop-full`). Good: four plans in
  one row, price per user per month with "billed yearly" switch on the card, "Everything in Free, plus…" lists, then
  a full comparison table grouped by theme with a footer row of buttons, then FAQ. Not so good: a tick or a cross
  with no explanation for many rows.
- **Vercel** ([vercel.com/pricing](https://vercel.com/pricing), `vercel-pricing-desktop-full`). Good: comparison table
  with a sticky plan header and a one-line description under each feature name; usage-based items explained with
  their unit. Not so good: three different ways of describing limits on one page.
- **Supabase** ([supabase.com/pricing](https://supabase.com/pricing), `supabase-pricing-desktop-full`). Good: the free
  plan's limits are concrete and generous, a cost calculator for usage, a long and honest FAQ, "self-host: free
  forever" visible. Not so good: the page is very long before the FAQ.

Also: PostHog (prices per unit with a slider, "Pay only for what you use" made literal), Dub and Cal.com (open source
plan shown as a first-class option).

**Ostrom rules** (prices are Lyes's decision of 30 October 2026: Free, Team 35 $, Business 65 $, Enterprise on
request, annual −20 %)

- **PB-PR1.** Four cards in one row on desktop (stacked on mobile): name, who it is for in one line, price "per
  active person / month", the yearly/monthly switch (yearly selected by default, the saving shown as "−20 %"), the
  limits that matter (people, cloud agents, cloud hours), "Everything in X, plus…", one action.
- **PB-PR2.** Under the cards, word for word: "We never charge for the AI itself." and "Bring your own models. We
  never resell model access."
- **PB-PR3.** A comparison table grouped by See / Steer / Prove / Security and admin / Support, with a sticky header
  of plan names and neutral actions (never garnet: the card above keeps the page's one garnet action, PB-C2), a one-line explanation under each row name, and a value or "—" in each cell (never a
  bare cross).
- **PB-PR4.** Self-hosting has its own line: open source, free, enterprise features unlocked by a key.
- **PB-PR5.** FAQ: what an active person is, what happens over a limit, BYOK, annual billing and refunds, taxes
  (Stripe Tax), self-hosting versus cloud, open source licences. Each answer short and true today.
- **PB-PR6.** Prices are rendered in the static HTML (not after a script), with currency and tax wording ("USD,
  excl. tax"). Both intervals are in the HTML: each card holds its yearly and its monthly price and action, and the
  switch is a pair of radio inputs that shows one set with CSS. Yearly is the checked input in the HTML, so the first
  paint, a crawler and a visitor without JavaScript all see yearly, and switching shifts nothing (both prices take
  the same box).
- **PB-PR7.** Once the console takes sign-ups, the Team and Business actions carry the plan and interval to it
  (`/signup?plan=…&interval=…`), the yearly and the monthly action being two real links so the right interval is
  sent without JavaScript; Free carries the plan only (`/signup?plan=free`); Enterprise opens a contact
  (`mailto:` or a form). Before sign-ups open, every action is "Become a design partner" (PB-W4: no link to a
  sign-up that does not exist).

### 3.4 Docs home and navigation

**The references**

- **Stripe** ([docs.stripe.com](https://docs.stripe.com/), `stripe-docs-desktop-light`). Good: search in the first
  place ("/" to focus) plus "Ask AI", product areas as top tabs, start tasks as cards ("Start a payment"), a "Copy
  for LLM"/Markdown option on pages. Not so good: light only; the home lists so many products that the first step
  is unclear for a new user.
- **Supabase** ([supabase.com/docs](https://supabase.com/docs), `supabase-docs-desktop-light`). Good: "Getting
  started" first, then products, then client libraries per language, then self-hosting; framework quickstarts as a
  grid of logos; light and dark. Not so good: two navigation systems (top menu and sidebar) that disagree on names.
- **Vercel** ([vercel.com/docs](https://vercel.com/docs), `vercel-docs-desktop-light`). Good: "Ask AI" and search,
  a feedback widget on every page, framework tabs, both themes. Not so good: the sidebar is long and
  flat in places.

Engines: Fumadocs ([fumadocs.dev](https://fumadocs.dev/docs)) gives, out of the box, search, "On this page", copy
buttons, tabs, "Copy Markdown / Open / Ask AI", a feedback widget, "Last updated", OpenAPI pages, `llms.txt` and
static export — the right base for Ostrom, and the format the docs already follow (`meta.json`). Mintlify (behind
Resend, Dub and Cal.com docs) is the hosted equivalent; we do not need it.

**Ostrom rules**

- **PB-D1.** The sidebar is grouped, not flat. Groups, in order: Get started (Introduction, Quickstart, Install),
  Concepts (Agents, Workflows, Approvals, Receipts), Guides (task pages), Cloud (Cloud sessions, Automations,
  Artifacts, Inference), Administration (Organizations, Billing, Security), Self-hosting, Reference (CLI, API,
  Workflow file, Receipt format), Help (FAQ, Troubleshooting, Migrate from TeamCode). Harness belongs to Concepts,
  MCP and secrets to Cloud. Fumadocs separators in `meta.json` (`"---Concepts---"`); `docs-tools`' `lintMeta`, which
  today reads every `pages` entry as a file, learns to accept them in the same pull request.
- **PB-D2.** Search opens with ⌘K / Ctrl K and "/", works offline from a static index (Orama), loads its index on
  first open, and returns headings, not only pages.
- **PB-D3.** Docs home: one sentence of what Ostrom is, a "Start here" path (Quickstart), then cards for the four
  concepts and the references. No marketing in the docs.
- **PB-D4.** Every page shows its `status` badge when it is not `available`.

### 3.5 A docs page and the quickstart

**The references**

- **Stripe quickstart** ([docs.stripe.com/payments/quickstart](https://docs.stripe.com/payments/quickstart),
  `stripe-docs-quickstart-desktop-light`). Good: the whole integration as numbered steps on the left, the code on
  the right changing with each step, language and framework selectors, a download of the finished project. Not so
  good: a lot of chrome around a small amount of code on mobile.
- **Astral uv** ([docs.astral.sh/uv/getting-started/installation](https://docs.astral.sh/uv/getting-started/installation/),
  `astral-docs-quickstart-desktop-light`). Good: one install command per OS in tabs ("macOS and Linux" / "Windows"),
  alternatives below (Homebrew, pip, Docker), how to upgrade and uninstall on the same page, "Edit this page".
  Not so good: generic Material for MkDocs look.
- **Supabase quickstart** ([supabase.com/docs/guides/getting-started/quickstarts/nextjs](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs),
  `supabase-docs-quickstart-desktop-light`). Good: an **"Agent prompt" box at the top** — the whole quickstart as a
  prompt you paste into your coding agent, with a copy button; a right rail with "Is this helpful?", "Copy as
  Markdown", "Ask ChatGPT", "Ask Claude" and "Connect your AI agent" above "On this page"; numbered steps, each one
  action with its code; "Edit this page on GitHub". Not so good: a cookie banner over the right rail on first visit.
- **Biome getting started** ([biomejs.dev/guides/getting-started](https://biomejs.dev/guides/getting-started/),
  `biome-docs-quickstart-desktop-light`). Good: "from nothing to your first check in three steps", numbered;
  one tab row mixes package managers and the standalone installer per OS (npm, pnpm, bun, deno, yarn, macOS/Linux,
  Windows), and the choice carries to every block on the page; version switcher (v2.x) in the header.

Also: Resend (each page has "Copy page" and "Open in ChatGPT/Claude", an API playground). Measured: Stripe's
quickstart shifts its layout while loading (CLS 0.199), a rare miss.

**Ostrom rules**

- **PB-DP1.** Page skeleton: title, one-sentence description (the front matter `description`, shown under the title),
  breadcrumbs, content, "Was this page helpful?" (yes/no, optional comment, sent as a PostHog event), "Edit this page
  on GitHub" (only once the repository is public), "Last updated" (from git), previous/next links.
- **PB-DP2.** Every code block has a copy button and a language label; shell blocks are written without a `$`
  prompt (the test runner executes them as written, and the copy button gives exactly the command).
  Blocks marked `test` run in CI (already in the docs contract); a block that cannot be tested says why
  (`notest="…"`).
- **PB-DP3.** Choices are tabs that persist across pages and visits: operating system (macOS, Linux, Windows),
  agent (Claude Code, Codex), package manager when relevant. The docs stay plain Markdown (no JSX): a tab set is
  consecutive code blocks with the same `group` and their own `tab` in the meta (`sh tab="macOS" group="os"`), which
  the site renders as Fumadocs `Tabs` with `groupId` and `persist`, and GitHub shows as plain blocks.
- **PB-DP4.** The quickstart: prerequisites first, then at most six numbered steps, each one action with its command
  and the output you should see, and it ends on a visible success (a receipt you can verify, a yes in the console).
  The time it takes is stated in the description and is true when measured on a clean machine.
- **PB-DP4b.** The quickstart and every task guide open with an **"Agent prompt"** block (Supabase): the same
  steps written as a prompt for Claude Code or Codex, with a copy button. Ostrom's users run agents; the docs hand
  them work the way the product does. The prompt never contains a secret and never asks the agent to approve its
  own gate.
- **PB-DP5.** Install page: one command per OS in tabs, the alternatives (Homebrew, a package, a binary download
  with its checksum and signature), how to upgrade, how to uninstall, how to verify the binary.
- **PB-DP6.** Callouts only of three kinds, written as GitHub alerts in plain Markdown (`> [!NOTE]`,
  `> [!WARNING]`, `> [!CAUTION]`) and rendered as Note, Warning and Danger with the info, amber and red tokens —
  never garnet. `docs-lint` rejects any other alert type.
- **PB-DP7.** Every concept page links to the reference it relies on and to one guide that uses it.

### 3.6 API and CLI reference

**The references**

- **Stripe API reference** ([docs.stripe.com/api](https://docs.stripe.com/api), `stripe-api-ref-desktop-light`). Good:
  the standard: two columns, prose and parameters on the left, request and response samples on the right in the
  chosen language, every object and every error documented, versioned. Not so good: very heavy page.
- **Resend API reference** ([resend.com/docs/api-reference/emails/send-email](https://resend.com/docs/api-reference/emails/send-email),
  `resend-api-ref-desktop-light`). Good: one endpoint per page, method and path in the title area, body parameters
  with types and "required", samples in eight languages in tabs, the response, a "Try it" playground.
- **Astral ruff rules** ([docs.astral.sh/ruff/rules](https://docs.astral.sh/ruff/rules/), `astral-api-ref-desktop-light`).
  Good: a generated reference of every rule with its code, status (stable, preview, deprecated) and fix
  availability; each rule page has "what it does", "why is this bad", an example and the fix. The model for a
  generated CLI or workflow-file reference.

**Ostrom rules**

- **PB-R1.** The API reference is generated from `ostrom-core/api/openapi.yaml` (fumadocs-openapi), never written by
  hand. One page per operation: method and path, authentication and scope, parameters with types, request sample in
  curl, TypeScript and Kotlin, response sample, error codes with their meaning.
- **PB-R2.** The CLI reference is generated from the CLI's own command definitions (a `--help` dump or a JSON
  manifest committed by the CLI release), one page per command with synopsis, options, examples and exit codes.
- **PB-R3.** The workflow file reference is generated from the workflow model's schema (`ostrom-core`), with an
  example per node type (step, check, gate, notification, agent, wait, triggers).
- **PB-R4.** The receipt format page keeps its test vectors downloadable and a "verify it yourself" snippet that
  runs in CI.
- **PB-R5.** Each reference states the version it describes and links to the changelog.

### 3.7 Changelog

**The references**

- **Linear** ([linear.app/changelog](https://linear.app/changelog), `linear-changelog-desktop-light`). Good: a
  date column and one entry per release with a title that is the benefit ("More ways to run and share Loops"),
  a video or image of the feature, two or three short paragraphs, then "Fixes and improvements" as a list; filters
  and search; a bell to subscribe. Not so good: no version numbers, so self-hosters cannot map an entry to a build.
- **Vercel** ([vercel.com/changelog](https://vercel.com/changelog), `vercel-changelog-desktop-light`). Good: one post
  per change with authors, date, and a link to the docs it changes; RSS. Not so good: very frequent, small entries
  make it hard to see what mattered this month.
- **Raycast** ([raycast.com/changelog](https://www.raycast.com/changelog), `raycast-changelog-desktop-light`) and **Zed**
  ([zed.dev/releases/stable](https://zed.dev/releases/stable), `zed-changelog-desktop-light`). Good: the version
  is the anchor (Raycast: a version badge and the date in the left column, one image titled by the benefit, then
  prose; tabs per platform, macOS / Windows / iOS). Zed: stable and preview channels, every version listed in a side
  column, download buttons per OS and architecture on each release, items grouped by area, each linked to its pull
  request (`#65850`) with thanks to outside contributors — the open source standard. Tailscale and Supabase add an RSS
  link at the top, Supabase a "Copy as Markdown".

**Ostrom rules**

- **PB-CL1.** One entry per release train (date as the anchor), titled by the benefit, with the versions of each
  component it includes (CLI, server, web, app) linking to their GitHub releases once public.
- **PB-CL2.** Sections inside an entry: the headline change (one image or a short muted video, ≤ 2 MB), then New,
  Improved, Fixed, and Breaking (with the migration step) when there is one.
- **PB-CL3.** Only what shipped and is enabled for customers. Generated from the release notes, edited by a person.
- **PB-CL4.** RSS/Atom feed, an anchor link per entry, an OG image per entry.

### 3.8 Blog

**The references**

- **Stripe** ([stripe.com/blog](https://stripe.com/blog), `stripe-blog-desktop-light`). Good: engineering posts with
  author photo and role, a reading width of ~65 characters, figures and code that look like the docs.
- **Linear "Now"** ([linear.app/now](https://linear.app/now), `linear-blog-desktop-light`). Good: changelog, launches
  and essays in one stream with filters; essays about how the team works (the "Method" voice).
- **Bun** ([bun.com/blog](https://bun.com/blog), `bun-blog-desktop-light`) and **Zed** ([zed.dev/blog](https://zed.dev/blog)).
  Good: release posts that show numbers and code first, with the install command at the top.

**Ostrom rules**

- **PB-B1.** Each post: title, one-line summary, author(s) with photo and role, date, reading time, OG image, RSS.
- **PB-B2.** Prose at 64 ch, code and figures in the docs' components, captions on every figure.
- **PB-B3.** Numbers follow PB-W3; research claims carry their source inline.

### 3.9 Open source page

**The references**

- **Supabase** ([supabase.com/open-source](https://supabase.com/open-source), `supabase-oss-desktop-full`). Good: one
  card per repository with its description, forks and stars, filtered by product; links to "How to contribute", the
  code of conduct and the community programme at the top. Not so good: a cookie banner over the cards on first visit.
- **Cal.com "Open"** ([cal.com/open](https://cal.com/open), `calcom-oss-desktop-full`). Good: "The most public
  private company": open data (team size over time, where the team is) drawn as real charts — transparency as
  marketing, the PostHog school. (Dub had such a page; `dub.co/open` now shows its "Page not found" with HTTP 200.)
- **Tailscale** ([tailscale.com/opensource](https://tailscale.com/opensource), `tailscale-oss-desktop-full`). Good:
  a numbered list of what is open (the client, the relay servers) and, as item 5, "A closed source coordination
  server"; why they open source; who they fund; how the community re-implementation (Headscale) relates to the
  product; a side table of contents and an FAQ. The model for saying plainly where the line is. Not so good: long
  prose, and a cookie banner across the page.

**Ostrom rules**

- **PB-OS1.** Lists every repository with its licence (Apache-2.0 for core and CLI, AGPL-3.0 with `ee/` under the
  Ostrom Enterprise License for server, web, app), what it is, and the link. Uses the money and open source sentence
  word for word.
- **PB-OS2.** Says what the enterprise key unlocks, in one table, so nobody discovers it after installing.
- **PB-OS3.** How to contribute (CONTRIBUTING, code of conduct, good first issues), how to report a vulnerability.
- **PB-OS4.** Not published, and no link to it, before the repositories are public.

### 3.10 Security and trust

**The references**

- **Vercel** ([vercel.com/security](https://vercel.com/security), `vercel-security-desktop-full`), **Linear**
  ([linear.app/security](https://linear.app/security), `linear-security-desktop-full`), **Resend**
  ([resend.com/security](https://resend.com/security), `resend-security-desktop-full`). Good: certifications with a
  way to request reports (Linear: "Request SOC 2 →" next to each), data encryption at rest and in transit,
  infrastructure provider and region, access control, sub-processors, responsible disclosure contact. Resend shows
  "HIPAA — in progress" next to its held badges: the honest form of a missing certification.
- **Tailscale** ([tailscale.com/security](https://tailscale.com/security), `tailscale-security-desktop-full`). Good:
  the most complete page — security bulletins, security policies published on GitHub, a list of controls by area,
  a security FAQ, a disclosure section that says what they will do with your report, and the plain sentence
  "Tailscale does not have a bug bounty program".

**Ostrom rules**

- **PB-SE1.** Says only what is true today: where the data is hosted, tenant isolation (row-level security per
  organisation), encryption, signed receipts and how to verify them, SSO availability, audit trail. No certification
  badge we do not hold; "SOC 2: not yet" is better than silence.
- **PB-SE2.** Vulnerability disclosure: `security@ostrom.run`, response time we can keep, `security.txt`, and the
  `SECURITY.md` of each repository say the same thing.
- **PB-SE3.** Sub-processors listed (hosting, email, payments, analytics, observability) with their purpose.

### 3.11 Status

Stripe ([status.stripe.com](https://status.stripe.com/)) and Supabase ([status.supabase.com](https://status.supabase.com/))
show per-component status, 90-day uptime bars and incident history with full write-ups.

- **PB-ST1.** A status page exists before the footer links to it. Components: Site, Console, API, Cloud agents,
  Notifications. Incident history with a write-up for every incident.
- **PB-ST2.** The site's footer dot reads the status page's public API after the `load` event (never on the
  critical path, PB-P4), in a slot whose size is reserved in the HTML (no shift), and stays a plain "Status" link if
  the call fails or is blocked.

### 3.12 404 and errors

- **Stripe** (`stripe-404-desktop-light`) answers with HTTP 404, its normal header and footer and links onward. Linear
  and Vercel answer an unknown URL with their login page and HTTP 200 (`linear-404-desktop-light`,
  `vercel-404-desktop-light`): search engines index nonsense URLs and the visitor is lost. Dub draws a good not-found
  page (header, "404", "Go back home", full footer with its status dot) but serves it with HTTP 200
  (`dub-oss-desktop-light`), a soft 404.
- **PB-E1.** Unknown URLs return HTTP 404 (nginx `error_page 404 /404.html`) with the site's header and footer, one
  sentence, a search box (docs search), links to Home, Docs and Changelog. Under `/docs/`, suggest the closest pages.
- **PB-E2.** Moved pages redirect (301) — every docs rename adds a redirect in the same pull request; the link checker
  fails on a broken internal link.

### 3.13 Console and app screens a stranger sees

Sign-in, sign-up, invitation, magic-link, password-less error pages of `app.ostrom.run`, and the app's store pages.

- Linear (`linear-404-desktop-light` is its sign-in): "Continue with Google", "Continue with email", "Continue with
  SAML SSO", "Log in with passkey", nothing else on the screen. Vercel: Email, Google, GitHub, and a sign-up link.
- **PB-CO1.** Sign-in shows GitHub, Google and email (magic link) as equal buttons, then "Use single sign-on" for SSO
  organisations. No password field. The screen has the logo, one heading, the buttons, the legal line, nothing else.
- **PB-CO2.** After asking for a magic link: the address it was sent to, "open it on this device", resend after 30 s,
  and a way to change the address.
- **PB-CO3.** Empty states in the console say what the screen will show and the one action that fills it (Linear,
  Vercel): never a blank table.
- **PB-CO4.** The same tokens, type and theme behaviour as the site (PB-C1 to PB-C4, PB-T1).
- **PB-CO5.** App store listing: screenshots of real screens in both themes, the first one showing an approval with
  its evidence; text from the locked proposition.

### 3.14 Repository front pages

(Covered for code by the open source standards of the repositories; listed here because a README is a public page.)

- **PB-G1.** README: logo, one-line description, badges (CI, licence, version) on one line, a screenshot or GIF, the
  install command, a 30-second example, links to docs, community and security, licence section.
- **PB-G2.** Social preview image (1 280 × 640) set on each repository, same design as the site's OG images.

---

## 4. Checklist

Every rule of this file has a row. "CI" names the check that fails when the rule is broken; "e2e" is a Playwright
test in the site's suite; "Review" means the reviewer checks it by hand, with the captures below.

| ID | Check | How it is verified |
|---|---|---|
| PB-W1 | Marketing wording matches the locked proposition | Review against `proposition-de-valeur.md`; strings live in `src/i18n/en.ts` |
| PB-W2 | No banned jargon on marketing pages outside `[data-audience="engineers"]` | CI: scan of the visible text nodes of the marketing routes |
| PB-W3 | Every number has a source or is ours and dated | Review |
| PB-W4 | Nothing presented as available before it ships | Review; docs `status` front matter |
| PB-W5, PB-W6 | Sentence-case titles, no "!" in headings, no "simply/just/easily" in instructions, no mixed languages | CI: scan of `h1`–`h3` and `<title>` for "!"; review |
| PB-T1 | Two families, self-hosted woff2, no Google Fonts request | e2e: no request to `fonts.googleapis.com` or `fonts.gstatic.com`; ≤ 2 font files loaded on an English page |
| PB-T2 | Display face at 125 % width, 800, −0.03 em | e2e: computed `font-stretch` of `h1` is 125 % and its weight 800; unit test: the Archivo file has a `wdth` axis reaching 125 |
| PB-T3 | Long-form columns give 60–75 characters per line | e2e at 1 440 px: computed `max-width` of the prose containers (`.prose`, docs article) between 60 ch and 75 ch |
| PB-T4, PB-T5 | Tabular figures; uppercase only for eyebrows and table headers | e2e: computed `font-variant-numeric` on prices and table cells; review |
| PB-C1 | No colour literal in components | CI: lint rule / grep for hex, `rgb(`, `hsl(` outside `tokens.css` |
| PB-C2 | ≤ 1 garnet button per viewport | e2e: count visible elements with the `--signal` background in each viewport-high slice of every route |
| PB-C3 | System default, three-way switch, no flash | e2e: load with stored "dark" and assert the first paint background |
| PB-C4, PB-A1 | axe: 0 violations, light and dark, desktop and mobile | CI `e2e` (axe on every route in the sitemap) |
| PB-L1, PB-L3, PB-L4 | Grid, docs columns, sticky header 56–64 px | e2e: header height and stickiness; docs column count at 1 280, 1 024 and 390 px |
| PB-L2 | No horizontal scroll at 320 px | e2e: `scrollWidth ≤ innerWidth` at 320 px on every route |
| PB-M1, PB-M4 | Motion only to explain; no scroll-jacking or parallax | Review with a screen recording |
| PB-M2 | Only `transform` and `opacity` animate | CI: grep of `transition`/`@keyframes` properties in the CSS; CLS budget |
| PB-M3 | Reduced motion shows the final frame | e2e with `reducedMotion: 'reduce'` |
| PB-P1 | Lighthouse budgets | CI `lighthouse` (lhci assertions: perf ≥ 0.95, a11y = 1, best practices = 1, SEO = 1, LCP, CLS, total byte weight, script size; budget assertions to add) |
| PB-P2, PB-P3 | Images optimised at build, sized, lazy below the fold; video rules | CI: postbuild check of image formats, sizes and `width`/`height`; review |
| PB-P4 | No third-party request before `load`, no cookie banner | e2e: request log until `load` contains only `ostrom.run` |
| PB-P5 | Long cache on fingerprinted assets, revalidated HTML, compression | e2e against the nginx container: response headers |
| PB-A2 | Skip link first | e2e: first Tab focuses "Skip to content" |
| PB-A3 | Keyboard reachable, visible focus, Escape closes menus | e2e: tab through header and menu, Escape returns focus |
| PB-A4 | Touch targets ≥ 24 px, primary ≥ 44 px on mobile | e2e at 390 px: bounding boxes of links and buttons |
| PB-A5 | Zoom allowed | e2e: viewport meta has no `maximum-scale` / `user-scalable=no` |
| PB-A6, PB-A7 | SVG hidden or titled; one `h1`, no skipped level | e2e: heading outline and SVG attributes on every route |
| PB-S1–S6 | Title, description length, canonical per page, OG, JSON-LD, sitemap, RSS, security.txt | CI: metadata test over every built page |
| PB-S7 | `noindex` until the go | e2e against the nginx container: `X-Robots-Tag` present with `indexable` off, absent with it on; no sitemap line while off |
| PB-AI1–AI3 | `llms.txt`, `llms-full.txt`, `.md` per docs page with its headers, Copy page | CI: postbuild check that each docs route has its `.md`; e2e on the headers |
| PB-H1, PB-H4, PB-H5 | Header and footer contents, links only to pages that exist | e2e: header link count; CI `links` |
| PB-H2, PB-OS4 | No link to a private repository before the go | CI: built HTML scan for `github.com/ostrom-hq` while `reposPublic` is off |
| PB-H3 | Mobile menu: button with `aria-expanded`, focus kept, Escape and navigation close it | e2e at 390 px |
| PB-LD1–LD8 | Landing order, proof, sections, mobile scene position | Review with captures; e2e: the scene's top is within 1.5 viewports at 390 px |
| PB-PR1–PR7 | Pricing structure, wording, static prices for both intervals, plan in sign-up link | e2e on `/pricing`, with JavaScript on and off |
| PB-D1 | Grouped sidebar | Review of `meta.json`; CI `docs-lint` accepts separators |
| PB-D2 | ⌘K search, static index, lazy | e2e: press ⌘K, type a heading, see it |
| PB-D3, PB-D4 | Docs home layout, status badges | e2e: a `coming-soon` page shows its badge |
| PB-DP1 | Feedback, edit link (once public), last updated, prev/next | e2e on one docs page |
| PB-DP2 | Copy on every block, `test` blocks run | CI `docs-test` |
| PB-DP3 | Persisted tabs | e2e: choose Windows, open another page, Windows is selected |
| PB-DP4, PB-DP4b | Quickstart ≤ 6 steps, timed on a clean machine, agent prompt block | Review; timing recorded in the PR |
| PB-DP5–DP7 | Install page contents, callout kinds, concept links | Review; CI `docs-lint` (alert types, to add) |
| PB-R1–R3 | References generated, not hand-written | CI: regenerate and diff |
| PB-R4, PB-R5 | Receipt vectors and snippet tested, version stated | CI `docs-test` |
| PB-CL1–CL4 | Changelog entries, feed, anchors | CI: feed validates; review |
| PB-B1–B3 | Blog post metadata, width, sources | CI: metadata test; review |
| PB-OS1–OS3 | Open source page contents | Review |
| PB-SE1–SE3 | Security page true today, disclosure consistent with `SECURITY.md`, sub-processors | Review; CI: `security.txt` contact equals the page's |
| PB-ST1, PB-ST2 | Status page before the link; dot after `load`, reserved slot | e2e: no status request before `load`, CLS budget |
| PB-E1 | 404 status and page | e2e against the nginx container: unknown URL → 404 and the page |
| PB-E2 | No broken internal link, redirects on rename | CI `links` |
| PB-CO1–CO5 | Console public screens | Review with captures (desktop, mobile, light, dark) |
| PB-G1, PB-G2 | README front page and social preview | Review in each repository |

### Captures a pull request attaches

A pull request that changes how a public page looks attaches four captures per changed page — desktop 1 440 × 900
and mobile 390 × 844, light and dark — before and after, and says which `PB-` items it touches.

---

## Appendix: the reference landings, measured

Measured on 30 October 2026 with Playwright and Chromium: LCP and CLS at 1 440 × 900 on a desktop connection; page
weight and requests at 390 × 844 with the cache disabled, counting bytes on the wire until `load` plus 3 s; axe-core
4.10 with the WCAG 2.0/2.1/2.2 A and AA rules. One run per page: read the orders of magnitude, not the decimals.

| Site | H1 face, size / weight | LCP (desktop) | CLS | axe serious + critical | JS on the wire (mobile) | Total (mobile) | Requests |
|---|---|---|---|---|---|---|---|
| Astral | Alliance Platt 100 px / 500 | 0.22 s | 0.009 | 4 | 0.5 MB | 2.9 MB | 51 |
| Biome | Geist 64 px / 600 | 2.42 s | 0.039 | 25 | 0.0 MB | 0.3 MB | 31 |
| Bun | Archivo 68 px / 800 | 0.24 s | 0 | 12 | 0.4 MB | 0.7 MB | 58 |
| Cal.com | Cal Sans 64 px / 600 | 0.29 s | 0 | 63 | 0.8 MB | 1.6 MB | 159 |
| Dub | Satoshi 48 px / 500 | 0.7 s | 0 | 46 | 1.5 MB | 7.4 MB | 145 |
| Fumadocs | Geist 48 px / 500 | 1.07 s | 0.004 | 3 | 0.6 MB | 1.3 MB | 60 |
| Linear | Inter 64 px / 510 | 1.59 s | 0 | 18 | 1.3 MB | 2.7 MB | 383 |
| Mintlify | Arizona Flare 50 px / 400 | 0.47 s | 0 | 4 | 1.2 MB | 3.4 MB | 65 |
| Notion | Inter 96 px / 600 | 0.27 s | 0.005 | 6 | 0.9 MB | 1.9 MB | 170 |
| PostHog | RoundHog 36 px / 800 | 0.33 s | 0.031 | 16 | 3.9 MB | 6.7 MB | 116 |
| Raycast | Inter 64 px / 600 | 0.76 s | 0.001 | 8 | 1.2 MB | 4.8 MB | 131 |
| Resend | Domaine 96 px / 400 | 0.22 s | 0 | 79 | 3.0 MB | 6.7 MB | 148 |
| Stripe | Söhne 40 px / 300 | 0.45 s | 0.024 | blocked by CSP | 1.4 MB | 2.0 MB | 111 |
| Supabase | Manrope 46 px / 500 | 0.48 s | 0 | 1 | 1.0 MB | 1.8 MB | 122 |
| Tailscale | Inter 64 px / 500 | 0.5 s | 0.289 | 5 | 1.8 MB | 3.1 MB | 107 |
| Vercel | Geist 64 px / 400 | 0.35 s | 0 | 2 | 1.2 MB | 1.8 MB | 109 |
| Zed | IBM Plex Serif 48 px / 340 | 1.34 s | 0 | 5 | 0.8 MB | 2.2 MB | 103 |

Captures, the raw measures of all 82 pages (landing, pricing, docs, quickstart, API reference, changelog, blog, open
source, security, status, 404) and the scripts that produced them are kept with the private research
(`research/public-bar/`: `captures/`, `data/`, `tables.md`, `scripts/`). Rerun them before changing a budget.
