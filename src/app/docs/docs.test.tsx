// SPDX-License-Identifier: Apache-2.0
import { cleanup, render, screen } from '@testing-library/react'
import { en } from '@/i18n/en'
import { searchIndexSchema } from '@/lib/docs/search'
import { OG_IMAGE } from '@/lib/seo'
import { FIXTURE_CONTENT, MISSING_CONTENT, UNSERVED_CONTENT, stubIntersectionObserver } from '@/test/docs'
import DocsLayout from './layout'
import DocsPage, { dynamicParams, generateMetadata, generateStaticParams } from './[[...slug]]/page'
import {
  GET as apiData,
  dynamic as apiDataDynamic,
  dynamicParams as apiDataParams,
  generateStaticParams as apiDataFiles,
} from './api-data/[file]/route'
import { GET, dynamic } from './search-index.json/route'

vi.mock('next/navigation', () => ({
  usePathname: () => '/docs/',
  useRouter: () => ({ push: vi.fn() }),
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
}))

const params = (slug?: string[]): { params: Promise<{ slug?: string[] }> } => ({
  params: Promise.resolve(slug === undefined ? {} : { slug }),
})

async function page(slug?: string[]): Promise<void> {
  render(await DocsPage(params(slug)))
}

beforeEach(() => {
  stubIntersectionObserver()
  vi.stubEnv('OSTROM_CONTENT_DIR', FIXTURE_CONTENT)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('the docs route', () => {
  it('generates every page and nothing else', () => {
    expect(dynamicParams).toBe(false)
    const slugs = generateStaticParams().map(({ slug }) => slug.join('/'))
    expect(slugs).toContain('')
    expect(slugs).toContain('v/v0.1/quickstart')
    expect(slugs).toContain('api/approvals')
    expect(slugs).toContain('api/schemas')
  })

  it('renders a guide with its table of contents and status', async () => {
    await page()
    expect(screen.getByRole('heading', { level: 1, name: /Introduction/ })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: en.docs.nav.toc })).toBeInTheDocument()
    expect(screen.getAllByText(en.docs.status.partial).length).toBeGreaterThan(0)
  })

  it('renders an archived page, its links kept in its version', async () => {
    await page(['v', 'v0.1'])
    expect(screen.getByRole('link', { name: 'quickstart' })).toHaveAttribute(
      'href',
      '/docs/v/v0.1/quickstart',
    )
  })

  it('renders the API overview, a tag and the schemas', async () => {
    await page(['api'])
    expect(screen.getByRole('heading', { level: 2, name: en.docs.api.authentication })).toBeInTheDocument()
    cleanup()
    await page(['api', 'approvals'])
    expect(screen.getByRole('heading', { level: 2, name: 'Request a gate' })).toBeInTheDocument()
    cleanup()
    await page(['api', 'schemas'])
    expect(screen.getByRole('heading', { level: 2, name: 'Node' })).toBeInTheDocument()
  })

  it('answers 404 for a page that does not exist', async () => {
    await expect(DocsPage(params(['nope']))).rejects.toThrow('NEXT_NOT_FOUND')
  })

  it('has a home and an honest API page before any content is merged', async () => {
    vi.stubEnv('OSTROM_CONTENT_DIR', MISSING_CONTENT)
    await page()
    expect(screen.getByText(en.docs.home.lead)).toBeInTheDocument()
    cleanup()
    await page(['api'])
    expect(screen.getByText(en.docs.api.missing)).toBeInTheDocument()
  })

  it('says no endpoint is live while the server serves none of the contract', async () => {
    vi.stubEnv('OSTROM_CONTENT_DIR', UNSERVED_CONTENT)
    await page(['api'])
    expect(screen.getByText(en.docs.api.notServed)).toBeInTheDocument()
  })
})

describe('the docs metadata', () => {
  it('titles, describes and canonicalises every kind of page', async () => {
    expect(await generateMetadata(params())).toMatchObject({
      title: { absolute: 'Introduction · Ostrom Docs' },
      description: 'What the fixture is.',
      alternates: { canonical: '/docs/' },
      openGraph: { type: 'article', url: '/docs/', images: [{ ...OG_IMAGE, alt: 'Introduction · Ostrom Docs' }] },
      twitter: { card: 'summary_large_image', images: [OG_IMAGE.url] },
    })
    expect((await generateMetadata(params(['v', 'v0.1']))).title).toEqual({
      absolute: 'Introduction (v0.1) · Ostrom Docs',
    })
    expect((await generateMetadata(params(['api']))).description).toBe(en.docs.api.description)
    expect((await generateMetadata(params(['api', 'approvals']))).title).toEqual({
      absolute: 'Approvals · API reference · Ostrom Docs',
    })
    expect((await generateMetadata(params(['api', 'schemas']))).description).toBe(
      en.docs.api.schemasDescription,
    )
    expect(await generateMetadata(params(['nope']))).toEqual({})
  })

  it('describes the home and the API page before any content, and while nothing is served', async () => {
    vi.stubEnv('OSTROM_CONTENT_DIR', MISSING_CONTENT)
    expect((await generateMetadata(params())).title).toEqual({
      absolute: `${en.docs.home.title} · Ostrom Docs`,
    })
    expect((await generateMetadata(params(['api']))).description).toBe(en.docs.api.missing)
    vi.stubEnv('OSTROM_CONTENT_DIR', UNSERVED_CONTENT)
    expect((await generateMetadata(params(['api']))).description).toBe(en.docs.api.notServed)
  })
})

describe('the docs layout and search index', () => {
  it('wraps the pages as they are', () => {
    render(<DocsLayout>{<p>inside</p>}</DocsLayout>)
    expect(screen.getByText('inside')).toBeInTheDocument()
  })

  it('serves the search index as JSON', async () => {
    expect(dynamic).toBe('force-static')
    const body: unknown = await GET().json()
    expect(searchIndexSchema.parse(body).entries.some((entry) => entry.href === '/docs/')).toBe(true)
  })
})

describe('the API data files', () => {
  it('are written once by the export: one per tag and one for the schemas, each a map of HTML', async () => {
    expect(apiDataDynamic).toBe('force-static')
    expect(apiDataParams).toBe(false)
    expect(apiDataFiles()).toContainEqual({ file: 'approvals.json' })
    expect(apiDataFiles()).toContainEqual({ file: 'schemas.json' })
    const response = await apiData(new Request('http://localhost/docs/api-data/approvals.json'), {
      params: Promise.resolve({ file: 'approvals.json' }),
    })
    const body: unknown = await response.json()
    expect(body).toHaveProperty('requestgate', expect.stringContaining('Seconds to wait'))
  })
})
