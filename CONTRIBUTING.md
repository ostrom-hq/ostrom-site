# Contributing to ostrom-site

## Documentation

The documentation lives in `content/docs/`, one `.mdx` file per page, ordered by a `meta.json` in each folder
(`{"title": "...", "pages": ["index", "quickstart", ...]}`).

### The one rule

A page documents only what is in the released code of the `ostrom-*` repositories. A part that is not released yet is
a page with `status: coming-soon` that says "Coming soon", or nothing at all.

### A page

```mdx notest="shape of a page"
---
title: Receipt format v1
description: "One sentence, shown under the title and in search results."
status: available
---

Plain Markdown. No import, no JSX component.
```

- `status` is `available`, `partial` (some sections are Coming soon) or `coming-soon`.
- Prose cannot hold `<`, `{` or `}`: MDX would read them as JSX. Put them in `code`.
- Links between pages are absolute: `[receipts](/docs/receipts)`. The lint fails on a link to a missing page.

### Every code block is tested or says why not

Each fenced block carries exactly one of these:

| Info string | What CI does |
|---|---|
| `sh test` | runs it with `bash -euo pipefail`; `exit="1"` expects another exit code |
| `js test` | runs it as an ES module with Node.js |
| `text output` | compares it with what the previous `test` block printed |
| `json file="receipt.json"` | writes it to that file, for the blocks after it |
| `text notest="why"` | nothing: the reason is required |

Blocks run in order, in one fresh empty folder per page (a temporary folder, not the page's own folder), so a page reads
like a script: a file block, a command, its output. A block sees only the files the blocks before it wrote.
A block that needs the real CLI or a real server says so with `requires="ostrom"` or `requires="server"`. CI provides
`OSTROM_BIN` (a path to the binary, a file named `ostrom`, put first on `PATH`) and `OSTROM_URL`, and fails such a block when they are
missing. `exit` and `requires` go on `test` blocks only.

The verifier of `receipts/format.mdx` is also run on every receipt and canonical-form case of the format's test vectors
(`docs-tools/vectors/`, frozen), by `docs-tools/test/receipt-format.test.mjs`.

### Check locally

```sh notest="needs this repository"
cd docs-tools
npm test              # the tooling's own tests, 100 % coverage
npm run lint:docs     # frontmatter, blocks, prose, links, navigation
npm run test:docs     # run every tested block
```

## Commits and pull requests

Conventional Commits in English, one subject per pull request, squash-merged when CI is green.
