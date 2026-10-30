import { checkLinks, extractIds, extractLinks, pathOfFile, resolvePath } from './links'

const origin = 'https://ostrom.run'

describe('pathOfFile', () => {
  it('maps exported files to the paths nginx serves', () => {
    expect(pathOfFile('index.html')).toBe('/')
    expect(pathOfFile('pricing/index.html')).toBe('/pricing/')
    expect(pathOfFile('/404.html')).toBe('/404.html')
    expect(pathOfFile('docs\\cli\\index.html')).toBe('/docs/cli/')
  })
})

describe('resolvePath', () => {
  const files = new Set(['index.html', 'pricing/index.html', '404.html', 'favicon.svg'])
  it('follows try_files', () => {
    expect(resolvePath('/', files)).toBe('index.html')
    expect(resolvePath('/pricing/', files)).toBe('pricing/index.html')
    expect(resolvePath('/pricing', files)).toBe('pricing/index.html')
    expect(resolvePath('/404', files)).toBe('404.html')
    expect(resolvePath('/favicon.svg', files)).toBe('favicon.svg')
    expect(resolvePath('/nope/', files)).toBeNull()
    expect(resolvePath('/nope', files)).toBeNull()
  })
})

describe('extract', () => {
  it('reads href, src and ids', () => {
    expect(extractLinks('<a href="/a?x=1&amp;y=2">a</a><img src="/b.png">')).toEqual(['/a?x=1&y=2', '/b.png'])
    expect(extractIds('<h2 id="one"></h2><p id="two">')).toEqual(new Set(['one', 'two']))
  })
})

describe('checkLinks', () => {
  it('passes a consistent site and ignores external, mail and data links', () => {
    const files = new Map([
      ['index.html', '<a href="/pricing/#plans">p</a><a href="#top">t</a><div id="top"></div><a href="https://github.com">g</a><a href="mailto:a@b">m</a><img src="data:image/png;base64,x"><a href="">e</a><link href="/favicon.svg">'],
      ['pricing/index.html', '<section id="plans"></section><a href="../">home</a>'],
      ['favicon.svg', ''],
    ])
    expect(checkLinks(files, origin)).toEqual([])
  })

  it('reports a missing page and a missing anchor', () => {
    const files = new Map([
      ['index.html', '<a href="/blog/">b</a><a href="/pricing/#nope">p</a><a href="https://ostrom.run/gone">abs</a>'],
      ['pricing/index.html', '<section id="plans"></section>'],
    ])
    expect(checkLinks(files, origin)).toEqual([
      { page: '/', href: '/blog/', reason: 'missing-page' },
      { page: '/', href: '/pricing/#nope', reason: 'missing-anchor' },
      { page: '/', href: 'https://ostrom.run/gone', reason: 'missing-page' },
    ])
  })

  it('does not look for anchors inside non-HTML files', () => {
    const files = new Map([
      ['index.html', '<a href="/feed.xml#x">f</a>'],
      ['feed.xml', ''],
    ])
    expect(checkLinks(files, origin)).toEqual([])
  })
})
