// SPDX-License-Identifier: Apache-2.0
import { fixtureSite } from '@/test/docs'
import { buildSearchIndex, searchIndexSchema } from './search'
import { createSearch, SEARCH_LIMIT } from './searchEngine'

const index = buildSearchIndex(fixtureSite(), { copy: 'Copy', apiTitle: 'API reference' })

describe('search index', () => {
  it('has an entry per page, with its description and the text before the first heading', () => {
    const intro = index.entries.find((entry) => entry.href === '/docs/' && entry.section === '')
    expect(intro?.title).toBe('Introduction')
    expect(intro?.text).toContain('What the fixture is.')
    expect(intro?.text).toContain('The fixture docs, before any heading.')
  })

  it('has an entry per section, linked to its anchor', () => {
    const section = index.entries.find((entry) => entry.href === '/docs/#what-works-today')
    expect(section?.section).toBe('What works today')
    expect(section?.version).toBe('latest')
    expect(
      index.entries.some((entry) => entry.version === 'v0.1' && entry.href === '/docs/v/v0.1/#here'),
    ).toBe(true)
  })

  it('has an entry per API operation, in the latest version', () => {
    const operation = index.entries.find((entry) => entry.href === '/docs/api/gates/#requestgate')
    expect(operation).toMatchObject({
      version: 'latest',
      title: 'API reference · Gates',
      section: 'Request a gate. The agent waits for the `yes`.',
    })
    expect(operation?.text).toContain('POST /api/v1/gates')
    expect(operation?.text).toContain('wait')
    expect(index.entries.find((entry) => entry.href === '/docs/api/gates/#get-apiv1gates')?.text).toBe(
      'GET /api/v1/gates org wait',
    )
  })

  it('numbers the entries and matches its own schema', () => {
    expect(index.entries.map((entry) => entry.id)).toEqual(index.entries.map((_, position) => position))
    expect(searchIndexSchema.parse(JSON.parse(JSON.stringify(index)))).toEqual(index)
  })
})

describe('createSearch', () => {
  const search = createSearch(index.entries, 'latest')

  it('finds pages and sections by prefix, in one version only', () => {
    const hits = search('quick')
    expect(hits).toContainEqual({ href: '/docs/quickstart/', title: 'Quickstart', section: '' })
    expect(hits.every((hit) => !hit.href.startsWith('/docs/v/'))).toBe(true)
    expect(createSearch(index.entries, 'v0.1')('quick').every((hit) => hit.href.startsWith('/docs/v/'))).toBe(
      true,
    )
  })

  it('finds API operations', () => {
    expect(search('gate').some((hit) => hit.href === '/docs/api/gates/#requestgate')).toBe(true)
  })

  it('returns nothing for a blank query, and at most the limit', () => {
    expect(search('  ')).toEqual([])
    const many = createSearch(
      Array.from({ length: SEARCH_LIMIT + 5 }, (_, id) => ({
        id,
        version: 'latest',
        href: `/p${String(id)}/`,
        title: 'Same',
        section: '',
        text: '',
      })),
      'latest',
    )
    expect(many('same')).toHaveLength(SEARCH_LIMIT)
  })
})
