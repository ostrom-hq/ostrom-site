import { z } from 'zod'

// The shape of /docs/search-index.json, shared by the build (search.ts) and the search dialog in the browser: this
// module must not import anything that reads files.

export const SEARCH_INDEX_PATH = '/docs/search-index.json'

export const searchEntrySchema = z.object({
  id: z.number().int(),
  version: z.string(),
  href: z.string(),
  title: z.string(),
  section: z.string(),
  text: z.string(),
})

export type SearchEntry = z.infer<typeof searchEntrySchema>

export const searchIndexSchema = z.object({ entries: z.array(searchEntrySchema) })

export type SearchIndex = z.infer<typeof searchIndexSchema>
