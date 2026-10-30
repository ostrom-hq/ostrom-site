// SPDX-License-Identifier: Apache-2.0
import { MISSING_CONTENT, fixtureSite } from '@/test/docs'
import {
  apiGroup,
  breadcrumbs,
  containsHref,
  pager,
  readingOrder,
  sidebar,
  type NavEntry,
} from './navigation'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildApiReference } from '@/lib/openapi/reference'
import { readDocsSite } from './site'

const docs = fixtureSite()
const labels = { apiReference: 'API reference', apiOverview: 'Overview', schemas: 'Schemas' }
const entries = sidebar(docs.latest, docs.api, labels)

const titles = (list: readonly NavEntry[]): string[] => list.map((entry) => entry.title)

describe('sidebar', () => {
  it('starts with the root index, follows meta.json with its sections and ends with the API reference', () => {
    expect(titles(entries)).toEqual(['Introduction', 'Quickstart', 'Guides', 'API reference'])
    const section = entries[2]
    if (section?.kind !== 'section') throw new Error('"---Guides---" should be a section')
    expect(titles(section.items)).toEqual(['Guides', 'Alpha', 'Zeta'])
    expect(entries[1]).toEqual({
      kind: 'link',
      title: 'Quickstart',
      href: '/docs/quickstart/',
      status: 'coming-soon',
    })
  })

  it('makes a folder a group, linked to its index when it has one', () => {
    const section = entries[2]
    const guides = section?.kind === 'section' ? section.items[0] : undefined
    if (guides?.kind !== 'group') throw new Error('guides should be a group')
    expect(guides.href).toBe('/docs/guides/')
    expect(guides.status).toBe('partial')
    const advanced = guides.items[1]
    if (advanced?.kind !== 'group') throw new Error('advanced should be a group')
    expect(advanced.href).toBeNull()
    expect(advanced.status).toBe('available')
  })

  it('lists the API overview, every tag and the schemas', () => {
    const api = entries[3]
    if (api?.kind !== 'group') throw new Error('the API reference should be a group')
    expect(readingOrder(api.items).map((item) => item.href)).toEqual([
      '/docs/api/',
      '/docs/api/approvals/',
      '/docs/api/other/',
      '/docs/api/schemas/',
    ])
    expect(apiGroup(null, labels).items).toHaveLength(1)
  })

  it('has no API reference in an archived version, and only the API reference without pages', () => {
    expect(titles(sidebar(docs.versions[1] ?? docs.latest, docs.api, labels))).toEqual([
      'Introduction',
      'Quickstart',
    ])
    expect(titles(sidebar(readDocsSite(MISSING_CONTENT).latest, null, labels))).toEqual(['API reference'])
  })
})

describe('edge cases', () => {
  it('lists a served API without schemas, and a version without an index page', () => {
    const api = buildApiReference(
      { openapi: '3.1.0', info: { title: 'T', version: '1' }, paths: { '/x': { get: { responses: {}, 'x-ostrom-status': 'served' } } } },
      'https://api.example.test',
    )
    expect(readingOrder(apiGroup(api, labels).items).map((item) => item.href)).toEqual(['/docs/api/', '/docs/api/other/'])
    const dir = mkdtempSync(join(tmpdir(), 'ostrom-nav-'))
    mkdirSync(join(dir, 'docs'))
    writeFileSync(join(dir, 'docs', 'only.mdx'), '---\ntitle: Only\ndescription: "Alone."\n---\n\nText.\n')
    expect(titles(sidebar(readDocsSite(dir).latest, null, labels))).toEqual(['Only', 'API reference'])
  })

  it('lists the index where meta.json puts it and drops a heading with nothing under it', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ostrom-nav-'))
    mkdirSync(join(dir, 'docs'))
    const page = (title: string): string => `---\ntitle: ${title}\ndescription: "About."\n---\n\nText.\n`
    writeFileSync(join(dir, 'docs', 'index.mdx'), page('Introduction'))
    writeFileSync(join(dir, 'docs', 'agents.mdx'), page('Agents'))
    writeFileSync(
      join(dir, 'docs', 'meta.json'),
      JSON.stringify({ pages: ['---Get started---', 'index', '---Concepts---', 'agents', '---Help---'] }),
    )
    const list = sidebar(readDocsSite(dir).latest, null, labels)
    expect(titles(list)).toEqual(['Get started', 'Concepts', 'API reference'])
    const [start, concepts] = list
    expect(start?.kind === 'section' && titles(start.items)).toEqual(['Introduction'])
    expect(breadcrumbs({ title: 'Docs', href: '/docs/' }, list, '/docs/agents/')).toEqual([
      { title: 'Docs', href: '/docs/' },
      { title: 'Agents', href: null },
    ])
    expect(concepts !== undefined && containsHref(concepts, '/docs/agents/')).toBe(true)
    expect(readingOrder(list).map((entry) => entry.href).slice(0, 2)).toEqual(['/docs/', '/docs/agents/'])
  })
})

describe('reading order', () => {
  it('reads groups depth first, their own page before their items', () => {
    expect(readingOrder(entries).map((entry) => entry.href)).toEqual([
      '/docs/',
      '/docs/quickstart/',
      '/docs/guides/',
      '/docs/guides/deep/',
      '/docs/guides/advanced/page/',
      '/docs/alpha/',
      '/docs/zeta/',
      '/docs/api/',
      '/docs/api/approvals/',
      '/docs/api/other/',
      '/docs/api/schemas/',
    ])
  })

  it('gives the previous and next pages', () => {
    expect(pager(entries, '/docs/')).toEqual({
      previous: null,
      next: { title: 'Quickstart', href: '/docs/quickstart/' },
    })
    expect(pager(entries, '/docs/api/schemas/').next).toBeNull()
    expect(pager(entries, '/docs/nowhere/')).toEqual({ previous: null, next: null })
  })
})

describe('breadcrumbs', () => {
  const home = { title: 'Docs', href: '/docs/' }

  it('walks the groups down to the page', () => {
    expect(breadcrumbs(home, entries, '/docs/guides/advanced/page/')).toEqual([
      home,
      { title: 'Guides', href: '/docs/guides/' },
      { title: 'Advanced', href: null },
      { title: 'Advanced page', href: null },
    ])
  })

  it('ends on a group when the page is its index, and on a top-level page', () => {
    expect(breadcrumbs(home, entries, '/docs/guides/')).toEqual([home, { title: 'Guides', href: null }])
    expect(breadcrumbs(home, entries, '/docs/alpha/')).toEqual([home, { title: 'Alpha', href: null }])
    expect(breadcrumbs(home, entries, '/docs/nowhere/')).toEqual([home])
  })

  it('knows which groups contain a page', () => {
    const section = entries[2]
    const guides = section?.kind === 'section' ? section.items[0] : undefined
    if (guides === undefined) throw new Error('guides should exist')
    expect(containsHref(guides, '/docs/guides/deep/')).toBe(true)
    expect(containsHref(guides, '/docs/alpha/')).toBe(false)
  })
})
