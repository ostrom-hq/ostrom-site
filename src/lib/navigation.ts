import type { Messages } from '@/i18n'
import type { SiteConfig } from './site'

export interface NavLink {
  readonly label: string
  readonly href: string
  /** Leaves the site (console, GitHub, mail): rendered as a plain anchor. */
  readonly external: boolean
}

export interface NavColumn {
  readonly title: string
  readonly links: readonly NavLink[]
}

const internal = (label: string, href: string): NavLink => ({ label, href, external: false })
const external = (label: string, href: string): NavLink => ({ label, href, external: true })

/** The console page that opens a sign-up, optionally for a plan and a billing interval. */
export function signupUrl(
  config: SiteConfig,
  plan?: { readonly plan: string; readonly interval: 'month' | 'year' },
): string {
  const url = new URL('/signup', config.appUrl)
  if (plan !== undefined) {
    url.searchParams.set('plan', plan.plan)
    url.searchParams.set('interval', plan.interval)
  }
  return url.toString()
}

export function signinUrl(config: SiteConfig): string {
  return new URL('/login', config.appUrl).toString()
}

export function headerLinks(messages: Messages): readonly NavLink[] {
  return [internal(messages.nav.product, '/#how-it-works'), internal(messages.nav.pricing, '/pricing/')]
}

export function footerColumns(messages: Messages, config: SiteConfig): readonly NavColumn[] {
  const links = messages.footer.links
  return [
    {
      title: messages.footer.columns.product,
      links: [internal(links.howItWorks, '/#how-it-works'), internal(links.pricing, '/pricing/')],
    },
    {
      title: messages.footer.columns.developers,
      links: [external(links.github, config.githubUrl)],
    },
    {
      title: messages.footer.columns.company,
      links: [external(links.contact, `mailto:${config.contactEmail}`)],
    },
  ]
}
