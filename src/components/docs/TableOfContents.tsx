// SPDX-License-Identifier: Apache-2.0
'use client'

import { useEffect, useState } from 'react'
import type { TocItem } from '@/lib/docs/markdown'

interface TableOfContentsProps {
  readonly items: readonly TocItem[]
  readonly label: string
}

/**
 * The section being read: the topmost heading in the top third of the window, else the last heading scrolled past
 * above it, else none (the top of the page). Read from the headings' positions, so it is right scrolling up as down.
 */
export function readingHeading(headings: readonly Element[], viewportHeight: number): string | null {
  const line = viewportHeight / 3
  let passed: string | null = null
  for (const heading of headings) {
    const { top } = heading.getBoundingClientRect()
    if (top >= 0 && top <= line) return heading.id
    if (top < 0) passed = heading.id
  }
  return passed
}

/** "On this page": the h2 and h3 of the page; the section being read is marked as it scrolls by. */
export function TableOfContents({ items, label }: TableOfContentsProps): React.JSX.Element | null {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const headings = items.flatMap((item) => {
      const heading = document.getElementById(item.id)
      return heading === null ? [] : [heading]
    })
    // The observer only says when a heading crosses the top third of the window; the positions decide.
    const observer = new IntersectionObserver(
      () => {
        setActive(readingHeading(headings, window.innerHeight))
      },
      { rootMargin: '0px 0px -66% 0px' },
    )
    for (const heading of headings) observer.observe(heading)
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
