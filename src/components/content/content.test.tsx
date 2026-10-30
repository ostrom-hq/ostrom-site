import { render, screen } from '@testing-library/react'
import { en } from '@/i18n/en'
import { parseMarkdown } from '@/lib/markdown'
import { Article } from './Article'
import { Markdown } from './Markdown'
import { PageHead } from './PageHead'
import { RepoName } from './RepoName'
import { readSiteConfig } from '@/lib/site'

const SOURCE = [
  '## Title `code` **bold** *em*',
  '### Sub',
  '#### Deep',
  'See [docs](/docs/) and [site](https://example.com).',
  '- one',
  '1. first',
  '> quote',
  '---',
  '```ts',
  'const x = 1',
  '```',
  '```',
  'plain',
  '```',
].join('\n')

describe('Markdown', () => {
  it('renders every block and inline kind', () => {
    const { container } = render(<Markdown blocks={parseMarkdown(SOURCE)} />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveAttribute('id', 'title-code-bold-em')
    expect(container.querySelector('h2 code')?.textContent).toBe('code')
    expect(container.querySelector('h2 strong')?.textContent).toBe('bold')
    expect(container.querySelector('h2 em')?.textContent).toBe('em')
    expect(screen.getByRole('heading', { level: 3, name: 'Sub' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 4, name: 'Deep' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'docs' })).not.toHaveAttribute('rel')
    expect(screen.getByRole('link', { name: 'site' })).toHaveAttribute('rel', 'noopener')
    expect(container.querySelector('ul li')?.textContent).toBe('one')
    expect(container.querySelector('ol li')?.textContent).toBe('first')
    expect(container.querySelector('blockquote')?.textContent).toBe('quote')
    expect(container.querySelector('hr')).not.toBeNull()
    const blocks = container.querySelectorAll('pre')
    expect(blocks[0]).toHaveAttribute('data-language', 'ts')
    expect(blocks[1]).not.toHaveAttribute('data-language')
  })
})

describe('Article', () => {
  it('shows the draft banner, the date and a table of contents', () => {
    render(
      <Article
        blocks={parseMarkdown('## One\n### Two')}
        draft
        updated="October 30, 2026"
        labels={en.pages}
      />,
    )
    expect(screen.getByRole('note')).toHaveTextContent(en.pages.draftBanner)
    expect(screen.getByText('Last updated October 30, 2026')).toBeInTheDocument()
    const toc = screen.getByRole('navigation', { name: en.pages.onThisPage })
    expect(toc.querySelector('a[href="#one"]')).not.toBeNull()
    expect(toc.querySelector('.article__toc-sub a')).toHaveAttribute('href', '#two')
  })

  it('stays plain without draft, date or headings', () => {
    render(<Article blocks={parseMarkdown('Text only.')} draft={false} labels={en.pages} />)
    expect(screen.queryByRole('note')).toBeNull()
    expect(screen.queryByRole('navigation')).toBeNull()
    expect(screen.queryByText(/Last updated/)).toBeNull()
  })
})

describe('PageHead', () => {
  it('renders the eyebrow, the title, the lead and extra content', () => {
    render(
      <PageHead eyebrow="Legal" title="Terms" lead="The terms.">
        <p>extra</p>
      </PageHead>,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Terms' })).toBeInTheDocument()
    expect(screen.getByText('The terms.')).toBeInTheDocument()
    expect(screen.getByText('extra')).toBeInTheDocument()
  })

  it('leaves the lead out when there is none', () => {
    const { container } = render(<PageHead eyebrow="Blog" title="Posts" />)
    expect(container.querySelector('.lead')).toBeNull()
  })
})

describe('RepoName', () => {
  it('links the repository only after the launch', () => {
    const { rerender } = render(
      <RepoName name="ostrom-cli" config={readSiteConfig({ NEXT_PUBLIC_LAUNCHED: '1' })} />,
    )
    expect(screen.getByRole('link', { name: 'ostrom-cli' })).toHaveAttribute(
      'href',
      'https://github.com/ostrom-hq/ostrom-cli',
    )
    rerender(<RepoName name="ostrom-cli" config={readSiteConfig({})} />)
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText('ostrom-cli')).toBeInTheDocument()
  })
})
