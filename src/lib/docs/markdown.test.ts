// SPDX-License-Identifier: Apache-2.0
import { codeBlockHtml, codeTitle } from './code'
import { highlight } from './highlight'
import { renderMarkdown } from './markdown'

const options = { copyLabel: 'Copy', rewriteHref: (href: string): string => href }

const page = `Intro text.

<div class="raw">dropped</div>

## What works today

| Part | Status |
|---|---|
| [Quickstart](/docs/quickstart) | Soon |

\`\`\`sh test
echo hello
\`\`\`

\`\`\`json file="receipt.json"
{ "id": "rcpt_1" }
\`\`\`

\`\`\`
plain text
\`\`\`

\`\`\`nope notest="no grammar"
x
\`\`\`

### Details

#### Deeper

Deep text.

# Top

## Details
`

describe('renderMarkdown', () => {
  const rendered = renderMarkdown(page, options)

  it('gives every heading its GitHub slug and a link to itself', () => {
    expect(rendered.html).toContain(
      '<h2 id="what-works-today"><a href="#what-works-today">What works today</a></h2>',
    )
    expect(rendered.html).toContain('<h3 id="details"><a href="#details">Details</a></h3>')
    expect(rendered.html).toContain('<h2 id="details-1">')
    expect(rendered.html).toContain('<h4 id="deeper">')
    expect(rendered.html).toContain('<h1 id="top">')
  })

  it('lists h2 and h3 in the table of contents', () => {
    expect(rendered.toc).toEqual([
      { id: 'what-works-today', text: 'What works today', depth: 2 },
      { id: 'details', text: 'Details', depth: 3 },
      { id: 'details-1', text: 'Details', depth: 2 },
    ])
  })

  it('cuts the page into search sections, the text before the first heading first', () => {
    expect(rendered.sections.map((section) => [section.id, section.title])).toEqual([
      [null, ''],
      ['what-works-today', 'What works today'],
      ['details', 'Details'],
      ['details-1', 'Details'],
    ])
    expect(rendered.sections[0]?.text).toBe('Intro text.')
    expect(rendered.sections[2]?.text).toBe('Deeper Deep text. Top')
    expect(rendered.sections[3]?.text).toBe('')
  })

  it('drops raw HTML and wraps tables so they scroll on their own', () => {
    expect(rendered.html).not.toContain('dropped')
    expect(rendered.html).toContain('<div class="table-wrap"><table>')
  })

  it('renders code blocks with a title, a Copy button and both themes', () => {
    expect(rendered.html).toContain('data-language="sh"')
    expect(rendered.html).toContain('<span class="docs-code__title">receipt.json</span>')
    expect(rendered.html).toContain('<button type="button" class="docs-copy" data-copy="">Copy</button>')
    expect(rendered.html).toContain('--shiki-dark')
    expect(rendered.html).toContain('data-language="text"')
    expect(rendered.html).toContain('<span class="docs-code__title">nope</span>')
    expect(rendered.html).not.toContain('notest')
  })

  it('rewrites links with the given function', () => {
    const moved = renderMarkdown('[a](/docs/a)', {
      copyLabel: 'Copy',
      rewriteHref: (href) => `/moved${href}`,
    })
    expect(moved.html).toContain('href="/moved/docs/a"')
  })

  it('keeps no empty section for a page that starts with a heading', () => {
    expect(renderMarkdown('## Only', options).sections).toEqual([{ id: 'only', title: 'Only', text: '' }])
  })
})

describe('code blocks', () => {
  it('titles a block by its title, its file, or its language, never "text"', () => {
    expect(codeTitle('sh', 'file="a.sh"', 'curl')).toBe('curl')
    expect(codeTitle('sh', 'test file="a.sh"', undefined)).toBe('a.sh')
    expect(codeTitle('sh', 'test', undefined)).toBe('sh')
    expect(codeTitle('text', '', undefined)).toBeNull()
  })

  it('renders a generated block as HTML', () => {
    const html = codeBlockHtml('curl https://example.test', {
      language: 'shellscript',
      meta: null,
      copyLabel: 'Copy',
      title: 'curl',
    })
    expect(html).toContain('<span class="docs-code__title">curl</span>')
    expect(html).toContain('<pre class="shiki')
  })

  it('highlights a known language and falls back to plain text', () => {
    const known = highlight('const a = 1\n', 'js')
    expect(known).toHaveLength(1)
    expect(known[0]?.tagName).toBe('pre')
    expect(highlight('x', 'nope')[0]?.tagName).toBe('pre')
  })
})
