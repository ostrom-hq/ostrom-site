// SPDX-License-Identifier: Apache-2.0
'use client'

import { useEffect, useRef } from 'react'
import type { Messages } from '@/i18n'
import type { DocsVersion } from '@/lib/docs/site'

interface VersionSelectProps {
  readonly versions: readonly DocsVersion[]
  readonly current: DocsVersion
  readonly labels: Messages['docs']['versions']
}

/**
 * The version picker: a disclosure of links to each version's home, so it works without a script. Once the runtime
 * runs, Escape closes the open menu and puts the focus back on its button.
 */
export function VersionSelect({ versions, current, labels }: VersionSelectProps): React.JSX.Element {
  const menu = useRef<HTMLDetailsElement>(null)
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      const details = menu.current
      if (event.key !== 'Escape' || details?.open !== true) return
      const inside = details.contains(document.activeElement)
      details.open = false
      // The focus goes back to the button only when it was in the menu: it never jumps from elsewhere.
      if (inside) details.querySelector('summary')?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
    }
  }, [])
  return (
    <details className="docs-version" ref={menu}>
      <summary>
        <span className="visually-hidden">{labels.label}: </span>
        {current.label}
      </summary>
      <ul>
        {versions.map((version) => (
          <li key={version.id}>
            <a href={`${version.basePath}/`} aria-current={version.id === current.id ? 'page' : undefined}>
              {version.label}
            </a>
          </li>
        ))}
      </ul>
    </details>
  )
}
