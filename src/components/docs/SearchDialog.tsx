'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { Messages } from '@/i18n'
import { SEARCH_INDEX_PATH, searchIndexSchema, type SearchIndex } from '@/lib/docs/search'
import { createSearch, type SearchHit } from '@/lib/docs/searchEngine'
import { fill } from '@/lib/docs/text'

/** Fetches the index built at build time and checks its shape (it crosses the network). */
export async function fetchSearchIndex(): Promise<SearchIndex> {
  const response = await fetch(SEARCH_INDEX_PATH)
  if (!response.ok) throw new Error(`search index: HTTP ${String(response.status)}`)
  return searchIndexSchema.parse(await response.json())
}

type IndexState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly search: (query: string) => SearchHit[] }
  | { readonly status: 'failed' }

interface SearchDialogProps {
  readonly labels: Messages['docs']['search']
  readonly version: string
  readonly onClose: () => void
  readonly load?: () => Promise<SearchIndex>
}

/**
 * The search dialog: a modal `<dialog>` (the page behind is inert, so focus stays inside; Esc closes it) with a
 * combobox. Arrows move through the results, Enter opens one, typing filters as you go.
 */
export default function SearchDialog({
  labels,
  version,
  onClose,
  load = fetchSearchIndex,
}: SearchDialogProps): React.JSX.Element {
  const dialog = useRef<HTMLDialogElement>(null)
  const listId = useId()
  const router = useRouter()
  const [index, setIndex] = useState<IndexState>({ status: 'loading' })
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => {
      element?.close()
    }
  }, [])

  useEffect(() => {
    load().then(
      (loaded) => {
        setIndex({ status: 'ready', search: createSearch(loaded.entries, version) })
      },
      () => {
        setIndex({ status: 'failed' })
      },
    )
  }, [load, version])

  const hits = useMemo(() => (index.status === 'ready' ? index.search(query) : []), [index, query])

  const open = (hit: SearchHit): void => {
    router.push(hit.href)
    onClose()
  }

  const status =
    index.status === 'loading'
      ? labels.loading
      : index.status === 'failed'
        ? labels.failed
        : query.trim() === ''
          ? labels.empty
          : hits.length === 0
            ? fill(labels.noResults, { query })
            : fill(labels.count, { count: String(hits.length) })

  return (
    <dialog ref={dialog} className="docs-search" aria-label={labels.dialog} onClose={onClose}>
      <div className="docs-search__field">
        <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16">
          <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          role="combobox"
          aria-label={labels.dialog}
          aria-expanded={hits.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={hits.length > 0 ? `${listId}-${String(active)}` : undefined}
          placeholder={labels.placeholder}
          value={query}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => {
            setQuery(event.target.value)
            setActive(0)
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault()
              const step = event.key === 'ArrowDown' ? 1 : -1
              setActive((current) => Math.min(Math.max(current + step, 0), Math.max(hits.length - 1, 0)))
            } else if (event.key === 'Enter') {
              const hit = hits[active]
              if (hit !== undefined) {
                event.preventDefault()
                open(hit)
              }
            }
          }}
        />
        <button
          type="button"
          className="docs-search__close"
          aria-label={labels.closeLabel}
          onClick={() => {
            dialog.current?.close()
          }}
        >
          {labels.close}
        </button>
      </div>
      <p className="docs-search__status" role="status">
        {status}
      </p>
      <ul className="docs-search__results" id={listId} role="listbox" aria-label={labels.results}>
        {hits.map((hit, position) => (
          <li
            key={hit.href}
            id={`${listId}-${String(position)}`}
            role="option"
            aria-selected={position === active}
            tabIndex={-1}
            className="docs-search__hit"
            onClick={() => {
              open(hit)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') open(hit)
            }}
            onMouseMove={() => {
              setActive(position)
            }}
          >
            <span className="docs-search__hit-title">{hit.section === '' ? hit.title : hit.section}</span>
            {hit.section === '' ? null : <span className="docs-search__hit-page">{hit.title}</span>}
          </li>
        ))}
      </ul>
      <p className="docs-search__hint" aria-hidden="true">
        {labels.hint}
      </p>
    </dialog>
  )
}
