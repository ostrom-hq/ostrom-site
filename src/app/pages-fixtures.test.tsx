// SPDX-License-Identifier: Apache-2.0
import { render, screen } from '@testing-library/react'
import { en } from '@/i18n/en'
import type * as Changelog from '@/lib/changelog'
import type * as Collections from '@/lib/collections'
import type * as Site from '@/lib/site'
import { sitemapEntries } from '@/lib/sitemap'
import PostPage, {
  generateMetadata as postMetadata,
  generateStaticParams as postParams,
} from './blog/[slug]/page'
import BlogIndex from './blog/page'
import { GET as rss } from './blog/rss.xml/route'
import ChangelogPage from './changelog/page'
import { generateMetadata as legalMetadata } from './legal/[slug]/page'

// The same pages over the fixtures: a published legal text, a published post next to a draft, and releases.
vi.mock('@/lib/collections', async (importOriginal) => {
  const path = await import('node:path')
  const root = path.join(process.cwd(), 'src/test/fixtures/content')
  const actual = await importOriginal<typeof Collections>()
  return {
    ...actual,
    legalPages: () => actual.legalPages(root),
    allPosts: () => actual.allPosts(root),
    publishedPosts: () => actual.publishedPosts(root),
  }
})
// The launch switch, flipped per test.
const launch = vi.hoisted(() => ({ launched: false }))
vi.mock('@/lib/site', async (importOriginal) => {
  const actual = await importOriginal<typeof Site>()
  return {
    ...actual,
    site: {
      ...actual.site,
      get launched() {
        return launch.launched
      },
    },
  }
})
vi.mock('@/lib/changelog', async (importOriginal) => {
  const path = await import('node:path')
  const actual = await importOriginal<typeof Changelog>()
  return {
    ...actual,
    loadReleases: () => actual.loadReleases(path.join(process.cwd(), 'src/test/fixtures/content')),
  }
})

describe('pages over published content', () => {
  it('indexes a published legal text', async () => {
    const metadata = await legalMetadata({ params: Promise.resolve({ slug: 'terms' }) })
    expect(metadata.robots).toBeUndefined()
  })

  it('lists published posts only, and builds drafts for review', () => {
    render(<BlogIndex />)
    expect(screen.getByRole('link', { name: 'Old post' })).toHaveAttribute('href', '/blog/old/')
    expect(screen.queryByText('New draft')).toBeNull()
    expect(postParams()).toEqual([{ slug: 'new' }, { slug: 'old' }])
  })

  it('renders a post, with the draft badge and noindex only on a draft', async () => {
    render(await PostPage({ params: Promise.resolve({ slug: 'new' }) }))
    expect(screen.getByText(en.blog.draft)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: `← ${en.blog.back}` })).toHaveAttribute('href', '/blog/')
    expect(await postMetadata({ params: Promise.resolve({ slug: 'new' }) })).toMatchObject({
      robots: { index: false, follow: false },
    })
    launch.launched = true
    expect(await postMetadata({ params: Promise.resolve({ slug: 'new' }) })).toMatchObject({
      robots: { index: false, follow: true },
    })
    launch.launched = false
    const published = await postMetadata({ params: Promise.resolve({ slug: 'old' }) })
    expect(published.robots).toBeUndefined()
    expect(published.openGraph).toMatchObject({
      type: 'article',
      publishedTime: '2026-01-02',
      authors: ['Ada'],
    })
    render(await PostPage({ params: Promise.resolve({ slug: 'old' }) }))
    expect(screen.getAllByText(en.blog.draft)).toHaveLength(1)
    await expect(postMetadata({ params: Promise.resolve({ slug: 'missing' }) })).rejects.toThrow('No post')
  })

  it('serves an RSS feed of the published posts', async () => {
    const response = rss()
    expect(response.headers.get('content-type')).toContain('application/rss+xml')
    const xml = await response.text()
    expect(xml).toContain('<title>Old post</title>')
    expect(xml).toContain('https://ostrom.run/blog/old/')
    expect(xml).not.toContain('New draft')
    expect(xml).toContain('Ostrom Blog')
  })

  it('links releases to GitHub only once the repositories are public', () => {
    render(<ChangelogPage />)
    expect(screen.queryByRole('link', { name: en.changelog.view })).toBeNull()
  })

  it('shows releases by month, with their notes and a link to GitHub', () => {
    launch.launched = true
    render(<ChangelogPage />)
    launch.launched = false
    expect(screen.getByRole('heading', { level: 2, name: 'November 2026' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Server 0.2' })).toBeInTheDocument()
    expect(screen.getByText('CLI')).toBeInTheDocument()
    expect(screen.getByText('ostrom login')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: en.changelog.view })).toHaveLength(3)
  })

  it('puts published posts and legal texts in the sitemap, never drafts', () => {
    const paths = sitemapEntries().map((entry) => entry.path)
    expect(paths).toContain('/blog/old/')
    expect(paths).toContain('/legal/terms/')
    expect(paths).not.toContain('/blog/new/')
    expect(paths).not.toContain('/legal/imprint/')
  })
})
