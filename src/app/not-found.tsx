// SPDX-License-Identifier: Apache-2.0
import Link from 'next/link'
import { getMessages } from '@/i18n'

export default function NotFound(): React.JSX.Element {
  const { notFound, nav, footer } = getMessages()
  const elsewhere = [
    { label: nav.pricing, href: '/pricing/' },
    { label: nav.changelog, href: '/changelog/' },
    { label: nav.blog, href: '/blog/' },
    { label: footer.links.security, href: '/security/' },
    { label: footer.links.status, href: '/status/' },
  ] as const
  return (
    <section className="container page-head">
      <p className="eyebrow">404</p>
      <h1>{notFound.title}</h1>
      <p className="lead">{notFound.body}</p>
      <div className="row">
        <Link className="button button--signal" href="/">
          {notFound.home}
        </Link>
      </div>
      <nav aria-label={notFound.elsewhere} className="not-found__links">
        <p className="small muted">{notFound.elsewhere}</p>
        <ul className="row">
          {elsewhere.map((link) => (
            <li key={link.href}>
              <Link href={link.href}>{link.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  )
}
