// SPDX-License-Identifier: Apache-2.0
import { MARKDOWN_LABELS } from '@/test/docs'
import { codeBlockHtml, codeTitle, metaAttribute } from './code'
import { highlight } from './highlight'
import { dropTabComment, isSafeUrl, renderMarkdown } from './markdown'

const options = { labels: MARKDOWN_LABELS, rewriteHref: (href: string): string => href }
const html = (markdown: string): string => renderMarkdown(markdown, options).html

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
      labels: MARKDOWN_LABELS,
      rewriteHref: (href) => `/moved${href}`,
    })
    expect(moved.html).toContain('href="/moved/docs/a"')
  })

  it('keeps no empty section for a page that starts with a heading', () => {
    expect(renderMarkdown('## Only', options).sections).toEqual([{ id: 'only', title: 'Only', text: '' }])
  })
})

describe('link and image schemes', () => {
  it('keeps http, https, mailto, relative and anchor URLs', () => {
    for (const url of ['https://a.test', 'http://a.test', 'mailto:a@b.test', '/docs/a', 'a/b:c', '#here', '//cdn.test/x', 'HTTPS://A.TEST'])
      expect(isSafeUrl(url)).toBe(true)
    for (const url of ['javascript:alert(1)', 'JavaScript:alert(1)', 'java\tscript:alert(1)', ' javascript:x', 'data:text/html,x', 'vbscript:x'])
      expect(isSafeUrl(url)).toBe(false)
  })

  it('drops a javascript: link and image, keeping the text and the alt', () => {
    const page = html('[click](javascript:alert(1)) and ![a cat](javascript:alert(2)) and [ok](https://a.test)\n\n[ref]\n\n[ref]: javascript:alert(3)')
    expect(page).not.toContain('javascript')
    expect(page).toContain('<span>click</span>')
    expect(page).toContain('<span>a cat</span>')
    expect(page).toContain('<span>ref</span>')
    expect(page).toContain('<a href="https://a.test">ok</a>')
    expect(html('![](data:image/png;base64,AAAA)')).toContain('<span></span>')
    expect(html('![logo](/logo.svg)')).toContain('<img src="/logo.svg" alt="logo">')
  })
})

describe('callouts', () => {
  it('turns the three GitHub alerts into asides with their title', () => {
    const page = html('> [!NOTE]\n> Read this.\n\n> [!WARNING]\n> Careful.\n\n> [!CAUTION]\n>\n> Danger.')
    expect(page).toContain('<aside class="docs-callout docs-callout--note"><p class="docs-callout__title">Note</p>')
    expect(page).toContain('<p>Read this.</p>')
    expect(page).toContain('<aside class="docs-callout docs-callout--warning"><p class="docs-callout__title">Warning</p>')
    expect(page).toContain('<aside class="docs-callout docs-callout--caution"><p class="docs-callout__title">Caution</p>')
    expect(page).toContain('<p>Danger.</p>')
    expect(page).not.toContain('[!')
  })

  it('keeps any other quote a quote, as docs-tools refuses it', () => {
    for (const quote of ['> [!TIP]\n> Tip.', '> [!NOTE] on the same line', '> [!note]\n> lower', '> Plain.', '> - a list', '> `[!NOTE]`'])
      expect(html(quote)).toContain('<blockquote>')
    expect(html('>')).toContain('<blockquote>')
  })
})

describe('tabs', () => {
  const tabs = [
    '```sh tab="macOS" group="os" test',
    '# macOS',
    'brew install ostrom',
    '```',
    '',
    '```sh tab="Linux" group="os" notest="CI runs macOS"',
    '# linux',
    'curl -fsSL https://ostrom.run/install | sh',
    '```',
    '',
    '```sh tab="Codex" group="agent" notest="x"',
    'codex',
    '```',
    '',
    '```sh tab="Claude Code" group="agent" notest="x"',
    '// not the tab',
    'claude',
    '```',
    '',
    'Text.',
    '',
    '```sh tab="Alone" group="os" notest="x"',
    '# Alone',
    'echo alone',
    '```',
  ].join('\n')
  const page = html(tabs)

  it('gathers consecutive blocks of one group into a set, a panel per tab with its label', () => {
    expect(page.match(/class="docs-tabs"/g)).toHaveLength(2)
    expect(page).toContain('<div class="docs-tabs" data-tabs="os"><div class="docs-tabs__panel" data-tab="macOS"><p class="docs-tabs__label">macOS</p><div class="docs-code" data-language="sh">')
    expect(page).toContain('<div class="docs-tabs__panel" data-tab="Linux"><p class="docs-tabs__label">Linux</p>')
    expect(page).toContain('<div class="docs-tabs" data-tabs="agent">')
    expect(page).not.toContain('data-tab-set')
  })

  it('drops the first line that names the tab, and keeps any other first line', () => {
    expect(page).not.toContain('# macOS')
    expect(page).not.toContain('# linux')
    expect(page).toContain('>//</span><span style="--shiki-light:#0A3069;--shiki-dark:#A5D6FF"> not</span>')
    expect(dropTabComment('# macOS\nbrew', 'macOS')).toBe('brew')
    expect(dropTabComment('brew', 'macOS')).toBe('brew')
    expect(dropTabComment('', 'macOS')).toBe('')
  })

  it('leaves a lone tabbed block, and a block missing its group, as plain blocks', () => {
    expect(page).toContain('# Alone')
    expect(html('```sh tab="macOS" notest="x"\na\n```\n\n```sh tab="Linux" notest="x"\nb\n```')).not.toContain('docs-tabs')
    expect(html('```sh tab="" group="os" notest="x"\na\n```\n\n```sh tab="b" group="os" notest="x"\nb\n```')).not.toContain('docs-tabs')
  })

  it('finds sets inside lists too', () => {
    const list = html('1. Install:\n\n   ```sh tab="a" group="os" notest="x"\n   a\n   ```\n\n   ```sh tab="b" group="os" notest="x"\n   b\n   ```\n')
    expect(list).toContain('<li>')
    expect(list).toContain('class="docs-tabs"')
  })
})

describe('code blocks', () => {
  it('titles a block by its title, its file, or its language, never "text"', () => {
    expect(codeTitle('sh', 'file="a.sh"', 'curl')).toBe('curl')
    expect(codeTitle('sh', 'test file="a.sh"', undefined)).toBe('a.sh')
    expect(codeTitle('sh', 'test', undefined)).toBe('sh')
    expect(codeTitle('text', '', undefined)).toBeNull()
    expect(codeTitle('text', 'output', undefined, 'Output')).toBe('Output')
    expect(codeTitle('text', 'output', undefined)).toBeNull()
    expect(codeTitle('sh', 'file=""', undefined)).toBe('sh')
  })

  it('reads the attributes of an info string as docs-tools does', () => {
    expect(metaAttribute('test tab="mac OS" group="os"', 'tab')).toBe('mac OS')
    expect(metaAttribute('notest="a \\"quoted\\" why"', 'notest')).toBe('a "quoted" why')
    expect(metaAttribute('test output', 'output')).toBe(true)
    expect(metaAttribute('outputs', 'output')).toBeUndefined()
  })

  it('titles an output block Output', () => {
    expect(html('```sh test\necho hi\n```\n\n```text output\nhi\n```')).toContain('<span class="docs-code__title">Output</span>')
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
