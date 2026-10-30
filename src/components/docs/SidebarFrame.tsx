'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface SidebarFrameProps {
  readonly label: string
  readonly menuLabel: string
  readonly children: React.ReactNode
}

/**
 * The sidebar's frame. On a phone it is folded behind a "Docs menu" button and folds again on the next page (it is
 * open for one path only); on a wide screen the button is hidden and the tree is always shown (docs.css).
 */
export function SidebarFrame({ label, menuLabel, children }: SidebarFrameProps): React.JSX.Element {
  const pathname = usePathname()
  const [openAt, setOpenAt] = useState<string | null>(null)
  const open = openAt === pathname
  return (
    <div className="docs-sidebar" data-open={open ? 'true' : 'false'}>
      <button
        type="button"
        className="button button--small docs-sidebar__toggle"
        aria-expanded={open}
        aria-controls="docs-sidebar-nav"
        onClick={() => {
          setOpenAt(open ? null : pathname)
        }}
      >
        {menuLabel}
      </button>
      <nav id="docs-sidebar-nav" aria-label={label} className="docs-nav">
        {children}
      </nav>
    </div>
  )
}
