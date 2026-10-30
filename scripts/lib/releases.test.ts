import { mergeEntries, parseGithubPages, REPOSITORIES, toEntries } from './releases'

const release = {
  tag_name: '0.1.0',
  name: null,
  published_at: '2026-10-30T10:00:00Z',
  html_url: 'https://github.com/ostrom-hq/ostrom-cli/releases/tag/0.1.0',
  body: null,
  draft: false,
}

describe('releases', () => {
  it('parses the pages gh returns', () => {
    expect(parseGithubPages(JSON.stringify([[release], []]))).toEqual([release])
    expect(() => parseGithubPages('[{"x":1}]')).toThrow()
  })

  it('keeps published releases, with defaults for missing names and notes', () => {
    expect(
      toEntries('ostrom-cli', [release, { ...release, draft: true }, { ...release, published_at: null }]),
    ).toEqual([
      {
        repository: 'ostrom-cli',
        tag: '0.1.0',
        name: '0.1.0',
        publishedAt: '2026-10-30T10:00:00Z',
        url: release.html_url,
        body: '',
      },
    ])
    expect(toEntries('x', [{ ...release, name: 'Named', body: 'Notes' }])[0]).toMatchObject({
      name: 'Named',
      body: 'Notes',
    })
  })

  it('merges repositories newest first', () => {
    const older = toEntries('a', [{ ...release, published_at: '2026-01-01T00:00:00Z' }])
    const newer = toEntries('b', [release])
    expect(mergeEntries([older, newer]).map((entry) => entry.repository)).toEqual(['b', 'a'])
    expect(REPOSITORIES).toContain('ostrom-server')
  })
})
