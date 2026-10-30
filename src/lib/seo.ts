import type { Metadata, MetadataRoute } from 'next'
import type { Messages } from '@/i18n'
import { absoluteUrl, type SiteConfig } from './site'

/** robots.txt: everything open after the launch, everything closed before it. */
export function robotsFor(config: SiteConfig): MetadataRoute.Robots {
  return {
    rules: config.launched ? { userAgent: '*', allow: '/' } : { userAgent: '*', disallow: '/' },
    sitemap: absoluteUrl('/sitemap.xml', config),
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
