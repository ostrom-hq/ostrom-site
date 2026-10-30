// SPDX-License-Identifier: Apache-2.0
'use client'

import { useEffect, useState } from 'react'
import type { TocItem } from '@/lib/docs/markdown'

interface TableOfContentsProps {
  readonly items: readonly TocItem[]
  readonly label: string
}

/** "On this page": the h2 and h3 of the page; the section being read is marked as it scrolls by. */
export function TableOfContents({ items, label }: TableOfContentsProps): React.JSX.Element | null {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting)
        if (visible !== undefined) setActive(visible.target.id)
      },
      // A heading counts as read when it crosses the top third of the window.
      { rootMargin: '0px 0px -66% 0px' },
    )
    for (const item of items) {
      const heading = document.getElementById(item.id)
      if (heading !== null) observer.observe(heading)
    }
    return () => {
      observer.disconnect()
    }
  }, [items])

  if (items.length === 0) return null
  return (
    <nav aria-label={label} className="docs-toc">
      <p className="docs-toc__title">{label}</p>
      <ul>
        {items.map((item) => (
          <li
            key={item.id}
            className={item.depth === 3 ? 'docs-toc__item docs-toc__item--nested' : 'docs-toc__item'}
          >
            <a href={`#${item.id}`} aria-current={item.id === active ? 'location' : undefined}>
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
