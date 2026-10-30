import { join } from 'node:path'
import { allPosts, formatDate, legalPages, legalSchema, postSchema, publishedPosts } from './collections'

const FIXTURES = join(process.cwd(), 'src/test/fixtures/content')

describe('collections', () => {
  it('orders legal pages notice first', () => {
    expect(legalPages(FIXTURES).map((page) => page.slug)).toEqual(['legal/imprint', 'legal/terms'])
  })

  it('lists posts newest first, and hides drafts from the published list', () => {
    expect(allPosts(FIXTURES).map((post) => post.slug)).toEqual(['blog/new', 'blog/old'])
    expect(publishedPosts(FIXTURES).map((post) => post.slug)).toEqual(['blog/old'])
  })

  it('accepts dates written as strings or read as dates by YAML', () => {
    expect(
      legalSchema.parse({ title: 't', description: 'd', updated: new Date('2026-10-30'), draft: true })
        .updated,
    ).toBe('2026-10-30')
    expect(
      postSchema.parse({ title: 't', description: 'd', date: '2026-10-31', author: 'a', draft: false }).date,
    ).toBe('2026-10-31')
    expect(
      postSchema.parse({
        title: 't',
        description: 'd',
        date: new Date('2026-10-31'),
        author: 'a',
        draft: false,
      }).date,
    ).toBe('2026-10-31')
  })

  it('formats dates in English', () => {
    expect(formatDate('2026-10-30')).toBe('October 30, 2026')
  })

  it('reads the real content', () => {
    expect(legalPages().map((page) => page.slug)).toEqual([
      'legal/imprint',
      'legal/terms',
      'legal/privacy',
      'legal/dpa',
      'legal/cookies',
    ])
    expect(allPosts().some((post) => post.slug === 'blog/launch')).toBe(true)
  })
})
