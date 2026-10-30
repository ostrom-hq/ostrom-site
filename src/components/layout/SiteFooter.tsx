// SPDX-License-Identifier: Apache-2.0
import Link from 'next/link'
import { Logo } from '@/components/brand/Logo'
import type { Messages } from '@/i18n'
import { footerColumns } from '@/lib/navigation'
import type { SiteConfig } from '@/lib/site'
import { NavAnchor } from './NavAnchor'
import { ThemeSelect } from './ThemeSelect'

interface SiteFooterProps {
  readonly messages: Messages
  readonly config: SiteConfig
  /** Slot for the cookie settings button, owned by the consent feature. */
  readonly extra?: React.ReactNode
}

export function SiteFooter({ messages, config, extra }: SiteFooterProps): React.JSX.Element {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <Link href="/" aria-label={messages.a11y.home}>
              <Logo className="site-footer__lockup" />
            </Link>
            <p className="site-footer__motif">{messages.footer.motif}</p>
            <p className="muted small">{messages.footer.slogan}</p>
          </div>
          <nav aria-label={messages.a11y.footerNav} className="site-footer__nav">
            {footerColumns(messages, config).map((column) => (
              <div key={column.title}>
                <h2 className="site-footer__title">{column.title}</h2>
                <ul>
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <NavAnchor link={link} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="site-footer__bottom">
          <p className="small muted">{messages.footer.copyright}</p>
          <div className="row">
            {extra}
            <ThemeSelect labels={messages.theme} />
          </div>
        </div>
      </div>
    </footer>
  )
}
