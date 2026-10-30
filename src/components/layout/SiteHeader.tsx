import Link from 'next/link'
import { Logo } from '@/components/brand/Logo'
import type { Messages } from '@/i18n'
import { headerLinks, signinUrl, signupUrl } from '@/lib/navigation'
import type { SiteConfig } from '@/lib/site'
import { NavAnchor } from './NavAnchor'

interface SiteHeaderProps {
  readonly messages: Messages
  readonly config: SiteConfig
}

export function SiteHeader({ messages, config }: SiteHeaderProps): React.JSX.Element {
  const links = headerLinks(messages)
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" className="site-header__logo" aria-label={messages.a11y.home}>
          <Logo className="site-header__lockup" />
        </Link>
        <nav aria-label={messages.a11y.mainNav} className="site-header__nav">
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <NavAnchor link={link} />
              </li>
            ))}
          </ul>
        </nav>
        <div className="site-header__actions">
          <a className="button button--ghost button--small site-header__signin" href={signinUrl(config)}>
            {messages.nav.signIn}
          </a>
          <a className="button button--signal button--small" href={signupUrl(config)}>
            {messages.nav.startFree}
          </a>
          <details className="site-header__menu">
            <summary className="button button--small">{messages.a11y.openMenu}</summary>
            <nav aria-label={messages.a11y.mainNav}>
              <ul>
                {links.map((link) => (
                  <li key={link.href}>
                    <NavAnchor link={link} />
                  </li>
                ))}
                <li>
                  <a href={signinUrl(config)}>{messages.nav.signIn}</a>
                </li>
              </ul>
            </nav>
          </details>
        </div>
      </div>
    </header>
  )
}
