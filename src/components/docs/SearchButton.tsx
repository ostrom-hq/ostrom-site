// SPDX-License-Identifier: Apache-2.0
'use client'

import { lazy, Suspense, useEffect, useState, useSyncExternalStore } from 'react'
import type { Messages } from '@/i18n'

// The dialog, MiniSearch and the index are fetched the first time someone opens the search: the first render of a
// docs page carries only this button.
const SearchDialog = lazy(() => import('./SearchDialog'))

const noSubscription = (): (() => void) => () => undefined
const isApple = (): boolean => /Mac|iPhone|iPad/.test(navigator.userAgent)

interface SearchButtonProps {
  readonly labels: Messages['docs']['search']
  /** The version whose pages the search covers. */
  readonly version: string
}

/** The search button of the docs bar; ⌘K or Ctrl+K opens the same dialog from anywhere in the docs. */
export function SearchButton({ labels, version }: SearchButtonProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const apple = useSyncExternalStore(noSubscription, isApple, () => true)

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <>
      <button
        type="button"
        className="docs-search-button"
        aria-haspopup="dialog"
        aria-keyshortcuts="Meta+K Control+K"
        onClick={() => {
          setOpen(true)
        }}
      >
        <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16">
          <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="docs-search-button__label">{labels.button}</span>
        <kbd aria-hidden="true">{apple ? '⌘K' : 'Ctrl K'}</kbd>
      </button>
      {open ? (
        <Suspense fallback={null}>
          <SearchDialog
            labels={labels}
            version={version}
            onClose={() => {
              setOpen(false)
            }}
          />
        </Suspense>
      ) : null}
    </>
  )
}
