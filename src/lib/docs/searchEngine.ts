import MiniSearch from 'minisearch'
import { z } from 'zod'
import type { SearchEntry } from './search'

// The search itself, in the browser. This module (and MiniSearch) is loaded only with the search dialog.

export interface SearchHit {
  readonly href: string
  readonly title: string
  readonly section: string
}

const hitSchema = z.object({ href: z.string(), title: z.string(), section: z.string() })

/** At most this many results are shown: past that, the query is too vague to help. */
export const SEARCH_LIMIT = 12

/** A search over one version's entries: prefix and typo-tolerant, titles and section headings weigh more. */
export function createSearch(
  entries: readonly SearchEntry[],
  version: string,
): (query: string) => SearchHit[] {
  const engine = new MiniSearch<SearchEntry>({
    fields: ['title', 'section', 'text'],
    storeFields: ['href', 'title', 'section'],
    searchOptions: { boost: { title: 3, section: 2 }, prefix: true, fuzzy: 0.2, combineWith: 'AND' },
  })
  engine.addAll(entries.filter((entry) => entry.version === version))
  return (query) => {
    if (query.trim() === '') return []
    return engine
      .search(query)
      .slice(0, SEARCH_LIMIT)
      .map((result) => hitSchema.parse(result))
  }
}
