# ostrom-site

The public website of Ostrom, [ostrom.run](https://ostrom.run): the landing page, pricing, docs, blog, changelog,
security, open source and legal pages. Next.js (App Router) in strict TypeScript, exported as static files and served
by nginx from a container image. Nothing renders at request time.

## Build and test

The steps of the single CI job `ci`, in order (`.github/workflows/ci.yml`; a draft pull request runs no CI):

```sh
pnpm install --frozen-lockfile
pnpm typecheck && pnpm lint && pnpm format:check   # types, lint, formatting
pnpm test:coverage                                 # Vitest, 100 % lines, branches, functions, statements
(cd docs-tools && npm ci && npm test && npm run lint:docs)  # the docs tooling and content
pnpm build && pnpm links                           # static export in out/, internal links and anchors
docker build -t ostrom-site .                      # the image Playwright and Lighthouse run against
PLAYWRIGHT_BASE_URL=http://localhost:8080 pnpm e2e # Playwright, desktop and mobile, axe WCAG 2.2 AA
pnpm exec lhci autorun --config=lighthouserc.cjs   # every page of the sitemap, 95 minimum per category
```

## Run locally

```sh
pnpm dev                 # http://localhost:3000, with hot reload
pnpm build && pnpm serve # the static export, served like nginx does
docker run -p 8080:8080 ghcr.io/ostrom-hq/ostrom-site:main
```

Build-time configuration (public URLs only, no secret): `NEXT_PUBLIC_SITE_URL` (default `https://ostrom.run`),
`NEXT_PUBLIC_APP_URL` (`https://app.ostrom.run`, where sign-up and sign-in live), `NEXT_PUBLIC_API_URL`
(`https://api.ostrom.run`), and `NEXT_PUBLIC_LAUNCHED`: unset until the public launch, the site asks search engines
not to index it (`robots.txt`, a `noindex` meta tag, an `X-Robots-Tag` header from nginx) and links to no repository;
`1` opens all of it.

## Image

`main` publishes `ghcr.io/ostrom-hq/ostrom-site:<sha>` and `:main`: the exact image Playwright and Lighthouse tested.
It listens on port 8080 as an unprivileged user and answers `GET /healthz`. The same build with
`NEXT_PUBLIC_LAUNCHED=1` is published as `:launched-<sha>` and `:launched`, for the day of the launch.

## Layout

- `src/app/`: the pages (App Router). `src/components/`: the components. `src/lib/`: logic, tested.
- `src/i18n/`: every text. English today; French later with the same keys. The marketing sentences are the locked value
  proposition, word for word.
- `src/styles/tokens.css`: the brand tokens (Signal, garnet `#8E1B3A`), copied from the brand system.
- `scripts/`: build tools (link checker, static server); their logic lives in `scripts/lib/` and is tested.
- `e2e/`: Playwright specs.

## License

Private until the public launch. The site code follows the product's licensing (to be confirmed by Lyes).
