// SPDX-License-Identifier: Apache-2.0
import type { Metadata, MetadataRoute } from 'next'
import type { Messages } from '@/i18n'
import { absoluteUrl, type SiteConfig } from './site'

/**
 * robots.txt: crawling stays open, before the launch too. Before it, every page and file says noindex (meta tag and
 * X-Robots-Tag): a crawler has to read the page to see that, and a page closed by robots.txt can still be listed,
 * without a snippet, if something links to it. The sitemap is announced only after the launch.
 */
export function robotsFor(config: SiteConfig): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    ...(config.launched ? { sitemap: absoluteUrl('/sitemap.xml', config) } : {}),
  }
}

/** The robots meta tag of every page: none after the launch (indexable), noindex before it. */
export function indexingFor(config: SiteConfig): Metadata['robots'] {
  return config.launched ? undefined : { index: false, follow: false }
}

export const OG_IMAGE = { url: '/og.png', width: 1200, height: 630 } as const

/** Structured data of the home page: the company and the product. */
export function homeJsonLd(config: SiteConfig, messages: Messages): string {
  const organization = {
    '@type': 'Organization',
    '@id': absoluteUrl('/#organization', config),
    name: messages.meta.siteName,
    url: absoluteUrl('/', config),
    logo: absoluteUrl('/icon-512.png', config),
    email: config.contactEmail,
    ...(config.launched ? { sameAs: [config.githubUrl] } : {}),
  }
  const application = {
    '@type': 'SoftwareApplication',
    name: messages.meta.siteName,
    description: messages.meta.description,
    url: absoluteUrl('/', config),
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'macOS, Linux, Windows, Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: { '@id': organization['@id'] },
  }
  // `<` is escaped so the JSON can never close the script element it is inlined in.
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': [organization, application] }).replace(
    /</g,
    '\\u003c',
  )
}
