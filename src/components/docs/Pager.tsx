// SPDX-License-Identifier: Apache-2.0
import Link from 'next/link'
import type { Messages } from '@/i18n'
import type { Pager as PagerModel } from '@/lib/docs/navigation'

interface PagerProps {
  readonly pager: PagerModel
  readonly labels: Messages['docs']['nav']
}

/** Previous and next page, in the order of the sidebar. */
export function Pager({ pager, labels }: PagerProps): React.JSX.Element | null {
  if (pager.previous === null && pager.next === null) return null
  return (
    <nav aria-label={labels.pager} className="docs-pager">
      {pager.previous === null ? (
        <span />
      ) : (
        <Link className="docs-pager__link" href={pager.previous.href} rel="prev">
          <span className="docs-pager__label">{labels.previous}</span>
          <span className="docs-pager__title">{pager.previous.title}</span>
        </Link>
      )}
      {pager.next === null ? null : (
        <Link className="docs-pager__link docs-pager__link--next" href={pager.next.href} rel="next">
          <span className="docs-pager__label">{labels.next}</span>
          <span className="docs-pager__title">{pager.next.title}</span>
        </Link>
      )}
    </nav>
  )
}
