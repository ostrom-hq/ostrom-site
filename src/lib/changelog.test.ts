import { join } from 'node:path'
import { byMonth, loadReleases, parseReleases, productName } from './changelog'

const FIXTURES = join(process.cwd(), 'src/test/fixtures/content')

describe('changelog', () => {
  it('loads releases newest first', () => {
    const releases = loadReleases(FIXTURES)
    expect(releases.map((release) => release.tag)).toEqual(['0.2.0', '0.1.0', '1.0.0'])
  })

  it('groups them by month', () => {
    const groups = byMonth(loadReleases(FIXTURES))
    expect(groups.map((group) => [group.month, group.releases.length])).toEqual([
      ['November 2026', 1],
      ['October 2026', 2],
    ])
  })

  it('names the product of a repository', () => {
    expect(productName('ostrom-web')).toBe('Console')
    expect(productName('other-repo')).toBe('other-repo')
  })

  it('refuses a malformed snapshot', () => {
    expect(() => parseReleases('[{"tag":"x"}]')).toThrow()
  })

  it('reads the committed snapshot', () => {
    expect(Array.isArray(loadReleases())).toBe(true)
  })
})
