import { z } from 'zod'

/** Where the site and the product live. Read once, at build time, from the public environment. */
export interface SiteConfig {
  /** The public site, ostrom.run. */
  readonly siteUrl: string
  /** The console, where people sign up and sign in. */
  readonly appUrl: string
  /** The API, whose health the status page reads. */
  readonly apiUrl: string
  readonly githubUrl: string
  readonly contactEmail: string
  readonly securityEmail: string
  readonly legalEmail: string
  /**
   * Lyes's go for the public launch, one switch for everything that must wait for it: until then the site asks search
   * engines not to index it and links to no repository (the GitHub organization is private).
   */
  readonly launched: boolean
}

const optionalUrl = z.url({ protocol: /^https?$/ }).optional()

const environmentSchema = z.object({
  NEXT_PUBLIC_SITE_URL: optionalUrl,
  NEXT_PUBLIC_APP_URL: optionalUrl,
  NEXT_PUBLIC_API_URL: optionalUrl,
  NEXT_PUBLIC_LAUNCHED: z.enum(['0', '1']).optional(),
})

/** The raw build environment: every value is checked by the schema, so any string may come in. */
export type SiteEnvironment = Readonly<Record<string, string | undefined>>

const withoutTrailingSlash = (url: string): string => url.replace(/\/+$/, '')

/** Parses the environment; a malformed URL fails the build instead of shipping a broken link. */
export function readSiteConfig(environment: SiteEnvironment): SiteConfig {
  const parsed = environmentSchema.parse(environment)
  return {
    siteUrl: withoutTrailingSlash(parsed.NEXT_PUBLIC_SITE_URL ?? 'https://ostrom.run'),
    appUrl: withoutTrailingSlash(parsed.NEXT_PUBLIC_APP_URL ?? 'https://app.ostrom.run'),
    apiUrl: withoutTrailingSlash(parsed.NEXT_PUBLIC_API_URL ?? 'https://api.ostrom.run'),
    githubUrl: 'https://github.com/ostrom-hq',
    contactEmail: 'hello@ostrom.run',
    securityEmail: 'security@ostrom.run',
    legalEmail: 'legal@ostrom.run',
    launched: parsed.NEXT_PUBLIC_LAUNCHED === '1',
  }
}

// Each variable is named in full so that Next.js inlines it in the client bundle.
export const site: SiteConfig = readSiteConfig({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_LAUNCHED: process.env.NEXT_PUBLIC_LAUNCHED,
})

/** Absolute URL of a path of the site, for canonical links, Open Graph and the sitemap. */
export function absoluteUrl(path: string, config: SiteConfig = site): string {
  return `${config.siteUrl}${path.startsWith('/') ? path : `/${path}`}`
}
