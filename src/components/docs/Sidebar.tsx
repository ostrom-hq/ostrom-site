// SPDX-License-Identifier: Apache-2.0
import Link from 'next/link'
import type { Messages } from '@/i18n'
import { containsHref, type NavEntry } from '@/lib/docs/navigation'
import { StatusBadge } from './StatusBadge'

interface TreeProps {
  readonly entries: readonly NavEntry[]
  readonly href: string
  readonly labels: Messages['docs']['status']
  readonly depth: number
}

function EntryLink({
  title,
  target,
  href,
  status,
  labels,
  className,
}: {
  readonly title: string
  readonly target: string
  readonly href: string
  readonly status: NavEntry['status']
  readonly labels: Messages['docs']['status']
  readonly className: string
}): React.JSX.Element {
  return (
    <Link
      className={className}
      href={target}
      prefetch={false}
      aria-current={target === href ? 'page' : undefined}
    >
      <span>{title}</span>
      <StatusBadge status={status} labels={labels} />
    </Link>
  )
}

/**
 * The sidebar tree. Top-level folders are sections with a heading (Stripe, Vercel); deeper folders fold, and open by
 * themselves down to the page being read. Plain HTML: no script to open or close a folder.
 */
export function SidebarTree({ entries, href, labels, depth }: TreeProps): React.JSX.Element {
  return (
    <ul className={depth === 0 ? 'docs-nav__list' : 'docs-nav__list docs-nav__list--nested'}>
      {entries.map((entry) => {
        if (entry.kind === 'link') {
          return (
            <li key={entry.href}>
              <EntryLink
                className="docs-nav__link"
                title={entry.title}
                target={entry.href}
                href={href}
                status={entry.status}
                labels={labels}
              />
            </li>
          )
        }
        const own =
          entry.href === null ? null : (
            <EntryLink
              className={depth === 0 ? 'docs-nav__heading docs-nav__heading--link' : 'docs-nav__link'}
              title={entry.title}
              target={entry.href}
              href={href}
              status={entry.status}
              labels={labels}
            />
          )
        if (depth === 0) {
          return (
            <li key={entry.title} className="docs-nav__section">
              {own ?? <span className="docs-nav__heading">{entry.title}</span>}
              <SidebarTree entries={entry.items} href={href} labels={labels} depth={1} />
            </li>
          )
        }
        return (
          <li key={entry.title}>
            <details className="docs-nav__folder" open={containsHref(entry, href)}>
              <summary>{entry.title}</summary>
              {own === null ? null : <div className="docs-nav__folder-index">{own}</div>}
              <SidebarTree entries={entry.items} href={href} labels={labels} depth={depth + 1} />
            </details>
          </li>
        )
      })}
    </ul>
  )
}
