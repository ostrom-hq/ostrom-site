// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildApiReference } from '@/lib/openapi/reference'
import { FIXTURE_CONTENT, MISSING_CONTENT, TEST_API_URL, fixtureSite } from '@/test/docs'
import { versionLinks, renderPage } from './render'
import {
  contentDir,
  docsRoutes,
  findRoute,
  getDocsSite,
  pageHref,
  pagesOf,
  readDocsSite,
  type DocsSite,
} from './site'
import { docsPath, docsSitemapEntries } from './sitemap'

const docs = fixtureSite()

function withVersions(json: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'ostrom-versions-'))
  writeFileSync(join(dir, 'docs-versions.json'), json)
  return dir
}

describe('readDocsSite', () => {
  it('reads every version and the API reference', () => {
    expect(docs.versions.map((version) => [version.id, version.basePath, version.latest])).toEqual([
      ['latest', '/docs', true],
      ['v0.1', '/docs/v/v0.1', false],
    ])
    expect(docs.latest).toBe(docs.versions[0])
    expect(docs.api?.baseUrl).toBe(TEST_API_URL)
  })

  it('still has a latest version when there is no content at all', () => {
    const empty = readDocsSite(MISSING_CONTENT)
    expect(empty.versions).toHaveLength(1)
    expect(empty.latest.root).toBeNull()
    expect(empty.api).toBeNull()
  })

  it('puts the latest version first when the versions file forgets it', () => {
    const site = readDocsSite(withVersions('[{"id": "old", "label": "Old"}]'))
    expect(site.versions.map((version) => version.id)).toEqual(['latest', 'old'])
  })

  it('refuses a versions file with repeated or malformed ids', () => {
    expect(() =>
      readDocsSite(withVersions('[{"id": "a", "label": "A"}, {"id": "a", "label": "B"}]')),
    ).toThrow('version ids repeat')
    expect(() => readDocsSite(withVersions('[{"id": "Bad Id", "label": "A"}]'))).toThrow('lowercase')
  })
})

describe('getDocsSite', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('reads the content folder of the repository, or the one the environment names', () => {
    expect(contentDir()).toBe(join(process.cwd(), 'content'))
    vi.stubEnv('OSTROM_CONTENT_DIR', FIXTURE_CONTENT)
    expect(contentDir()).toBe(FIXTURE_CONTENT)
  })

  it('reads a folder once', () => {
    expect(getDocsSite(MISSING_CONTENT)).toBe(getDocsSite(MISSING_CONTENT))
  })
})

describe('routes', () => {
  it('lists every page of every version, then the API reference', () => {
    expect(docsRoutes(docs).map((entry) => [entry.slug.join('/'), entry.route.kind])).toEqual([
      ['', 'page'],
      ['quickstart', 'page'],
      ['guides', 'page'],
      ['guides/deep', 'page'],
      ['guides/advanced/page', 'page'],
      ['alpha', 'page'],
      ['zeta', 'page'],
      ['v/v0.1', 'page'],
      ['v/v0.1/quickstart', 'page'],
      ['api', 'api-overview'],
      ['api/gates', 'api-tag'],
      ['api/other', 'api-tag'],
      ['api/schemas', 'api-schemas'],
    ])
  })

  it('gives a version without pages a home, and the API an overview that says it is missing', () => {
    expect(docsRoutes(readDocsSite(MISSING_CONTENT)).map((entry) => entry.route.kind)).toEqual([
      'home',
      'api-overview',
    ])
  })

  it('finds a route by its slug, and nothing for an unknown one', () => {
    expect(findRoute(docs, ['guides', 'deep'])?.kind).toBe('page')
    expect(findRoute(docs, ['nope'])).toBeNull()
  })

  it('refuses an API tag that would shadow the schemas page', () => {
    const api = buildApiReference(
      {
        openapi: '3.1.0',
        info: { title: 'T', version: '1' },
        paths: { '/a': { get: { tags: ['schemas'], responses: {}, 'x-ostrom-status': 'served' } } },
      },
      TEST_API_URL,
    )
    const shadowed: DocsSite = { ...readDocsSite(MISSING_CONTENT), api }
    expect(() => docsRoutes(shadowed)).toThrow('"schemas"')
  })

  it('builds page URLs and lists the pages of a folder in reading order', () => {
    expect(pageHref(docs.latest, ['guides', 'deep'])).toBe('/docs/guides/deep/')
    expect(pageHref(docs.versions[1] ?? docs.latest, [])).toBe('/docs/v/v0.1/')
    const root = docs.latest.root
    if (root === null) throw new Error('the fixture has pages')
    expect(pagesOf(root).map((page) => page.frontmatter.title)).toEqual([
      'Introduction',
      'Quickstart',
      'Guides',
      'Deep guide',
      'Advanced page',
      'Alpha',
      'Zeta',
    ])
  })
})

describe('versions', () => {
  const archived = docs.versions[1] ?? docs.latest

  it('keeps the links of the latest version as they are', () => {
    expect(versionLinks(docs.latest)('/docs/quickstart')).toBe('/docs/quickstart')
  })

  it('points an archived version at its own pages, never at the API or another version', () => {
    const rewrite = versionLinks(archived)
    expect(rewrite('/docs/quickstart')).toBe('/docs/v/v0.1/quickstart')
    expect(rewrite('/docs')).toBe('/docs/v/v0.1')
    expect(rewrite('/docs#here')).toBe('/docs/v/v0.1#here')
    expect(rewrite('/docs/api/')).toBe('/docs/api/')
    expect(rewrite('/docs/v/other/')).toBe('/docs/v/other/')
    expect(rewrite('/docsy')).toBe('/docsy')
    expect(rewrite('#here')).toBe('#here')
    expect(rewrite('https://example.com')).toBe('https://example.com')
  })

  it('renders a page once per build', () => {
    const page = archived.root?.index ?? null
    if (page === null) throw new Error('the archived version has an index')
    const first = renderPage(archived, page, 'Copy')
    expect(renderPage(archived, page, 'Copy')).toBe(first)
    expect(first.html).toContain('href="/docs/v/v0.1/quickstart"')
    expect(first.html).toContain('href="/docs/api/"')
  })
})

describe('sitemap entries', () => {
  it('publishes every docs route, the guides above the generated reference', () => {
    const entries = docsSitemapEntries(docs)
    expect(entries[0]).toEqual({ path: '/docs/', priority: 0.7, changeFrequency: 'weekly' })
    expect(entries.find((entry) => entry.path === '/docs/api/gates/')?.priority).toBe(0.6)
    expect(docsSitemapEntries(readDocsSite(MISSING_CONTENT))[0]?.priority).toBe(0.7)
    expect(docsPath(['api', 'gates'])).toBe('/docs/api/gates/')
  })

  it('reads the content of the build by default', () => {
    expect(docsSitemapEntries().some((entry) => entry.path === '/docs/api/')).toBe(true)
  })
})
