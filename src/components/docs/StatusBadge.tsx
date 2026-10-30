// SPDX-License-Identifier: Apache-2.0
import type { Messages } from '@/i18n'
import type { PageStatus } from '@/lib/docs/content'

interface StatusBadgeProps {
  readonly status: PageStatus
  readonly labels: Messages['docs']['status']
}

/** Nothing for an available page; "Partial" or "Coming soon" otherwise. */
export function StatusBadge({ status, labels }: StatusBadgeProps): React.JSX.Element | null {
  if (status === 'available') return null
  return (
    <span className={`badge docs-status docs-status--${status}`}>
      {status === 'partial' ? labels.partial : labels.comingSoon}
    </span>
  )
}
