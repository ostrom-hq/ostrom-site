// SPDX-License-Identifier: Apache-2.0
import { en } from '@/i18n/en'
import { homeJsonLd, indexingFor, OG_IMAGE, robotsFor } from './seo'
import { readSiteConfig } from './site'

const before = readSiteConfig({})
const after = readSiteConfig({ NEXT_PUBLIC_LAUNCHED: '1' })

describe('seo', () => {
  it('lets crawlers read the noindex before the launch, and announces the sitemap after', () => {
    expect(robotsFor(before)).toEqual({ rules: { userAgent: '*', allow: '/' } })
    expect(robotsFor(after)).toEqual({
      rules: { userAgent: '*', allow: '/' },
      sitemap: 'https://ostrom.run/sitemap.xml',
    })
  })

  it('marks every page noindex until the launch', () => {
    expect(indexingFor(before)).toEqual({ index: false, follow: false })
    expect(indexingFor(after)).toBeUndefined()
  })

  it('describes the company and the product, linking GitHub only after the launch', () => {
    const graph: unknown = JSON.parse(homeJsonLd(before, en))
    expect(graph).toMatchObject({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'Organization', name: 'Ostrom', url: 'https://ostrom.run/' },
        { '@type': 'SoftwareApplication', offers: { price: '0', priceCurrency: 'USD' } },
      ],
    })
    expect(homeJsonLd(before, en)).not.toContain('github.com')
    expect(homeJsonLd(after, en)).toContain('https://github.com/ostrom-hq')
    expect(homeJsonLd(before, { ...en, meta: { ...en.meta, siteName: '</script>' } })).not.toContain(
      '</script>',
    )
  })

  it('shares a 1200 by 630 card', () => {
    expect(OG_IMAGE).toEqual({ url: '/og.png', width: 1200, height: 630 })
  })
})
