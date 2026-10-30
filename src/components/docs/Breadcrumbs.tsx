import Link from 'next/link'
import type { Crumb } from '@/lib/docs/navigation'

interface BreadcrumbsProps {
  readonly crumbs: readonly Crumb[]
  readonly label: string
}

/** The path to the page; the page itself is the last crumb, not a link. Hidden on the docs home. */
export function Breadcrumbs({ crumbs, label }: BreadcrumbsProps): React.JSX.Element | null {
  if (crumbs.length < 2) return null
  return (
    <nav aria-label={label} className="docs-crumbs">
      <ol>
        {crumbs.map((crumb) => (
          <li key={`${crumb.title}${crumb.href ?? ''}`}>
            {crumb.href === null ? (
              <span aria-current="page">{crumb.title}</span>
            ) : (
              <Link href={crumb.href} prefetch={false}>
                {crumb.title}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
