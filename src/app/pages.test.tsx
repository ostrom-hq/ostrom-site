import { render, screen } from '@testing-library/react'
import { en } from '@/i18n/en'
import BlogIndex, { metadata as blogMetadata } from './blog/page'
import ChangelogPage, { metadata as changelogMetadata } from './changelog/page'
import ComparePage, { metadata as compareMetadata } from './compare/page'
import LegalPage, {
  generateMetadata as legalMetadata,
  generateStaticParams as legalParams,
} from './legal/[slug]/page'
import LegalIndex, { metadata as legalIndexMetadata } from './legal/page'
import OpenSourcePage, { metadata as openSourceMetadata } from './open-source/page'
import SecurityPage, { metadata as securityMetadata } from './security/page'
import StatusPage, { metadata as statusMetadata } from './status/page'

// The real content of the repository: every legal text and the launch post are drafts, the changelog is empty.
describe('content pages', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('lists the legal texts, notice first', () => {
    render(<LegalIndex />)
    const links = screen.getAllByRole('link').map((link) => link.getAttribute('href'))
    expect(links).toEqual([
      '/legal/imprint/',
      '/legal/terms/',
      '/legal/privacy/',
      '/legal/dpa/',
      '/legal/cookies/',
    ])
    expect(legalIndexMetadata.title).toBe('Legal')
  })

  it('builds one page per legal text, marked as a draft to validate and kept out of search', async () => {
    expect(legalParams().map((param) => param.slug)).toEqual([
      'imprint',
      'terms',
      'privacy',
      'dpa',
      'cookies',
    ])
    const params = Promise.resolve({ slug: 'imprint' })
    render(await LegalPage({ params }))
    expect(screen.getByRole('heading', { level: 1, name: 'Legal notice' })).toBeInTheDocument()
    expect(screen.getByRole('note')).toHaveTextContent('à valider')
    expect(screen.getByText(/under number 933 169 278/)).toBeInTheDocument()
    expect(await legalMetadata({ params })).toMatchObject({
      robots: { index: false },
      alternates: { canonical: '/legal/imprint/' },
    })
    await expect(legalMetadata({ params: Promise.resolve({ slug: 'missing' }) })).rejects.toThrow(
      'No legal page',
    )
  })

  it('keeps the blog index empty while the launch post is a draft', () => {
    render(<BlogIndex />)
    expect(screen.getByText(en.blog.empty)).toBeInTheDocument()
    expect(blogMetadata.alternates?.types).toEqual({ 'application/rss+xml': '/blog/rss.xml' })
  })

  it('says the changelog fills at launch', () => {
    render(<ChangelogPage />)
    expect(screen.getByText(en.changelog.empty)).toBeInTheDocument()
    expect(changelogMetadata.title).toBe('Changelog')
  })

  it('explains the threat model, the receipts and how to report a vulnerability', () => {
    render(<SecurityPage />)
    for (const item of en.security.threats) expect(screen.getByText(item.threat)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: en.security.disclosureTitle })).toHaveAttribute(
      'id',
      'disclosure',
    )
    expect(screen.getByRole('link', { name: 'security@ostrom.run' })).toHaveAttribute(
      'href',
      'mailto:security@ostrom.run',
    )
    expect(screen.getByRole('link', { name: 'security.txt' })).toHaveAttribute(
      'href',
      '/.well-known/security.txt',
    )
    expect(securityMetadata.title).toBe('Security')
  })

  it('lists each repository with its license', () => {
    render(<OpenSourcePage />)
    // Not launched: the repositories are private, so their names are not links yet.
    expect(screen.getByText('ostrom-core')).not.toHaveAttribute('href')
    expect(screen.queryByRole('link', { name: 'ostrom-core' })).toBeNull()
    expect(screen.getAllByText('Apache 2.0')).toHaveLength(2)
    expect(screen.getAllByText('AGPL 3.0, ee/ commercial')).toHaveLength(3)
    expect(openSourceMetadata.title).toBe('Open source')
  })

  it('compares honestly, saying when the other choice is better', () => {
    render(<ComparePage />)
    expect(screen.getAllByText(en.compare.choose)).toHaveLength(en.compare.items.length)
    expect(compareMetadata.title).toBe('Compare')
  })

  it('checks the status from the browser', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => undefined)),
    )
    render(<StatusPage />)
    expect(screen.getByRole('heading', { level: 1, name: en.status.title })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'hello@ostrom.run' })).toBeInTheDocument()
    expect(statusMetadata.title).toBe('Status')
  })
})
