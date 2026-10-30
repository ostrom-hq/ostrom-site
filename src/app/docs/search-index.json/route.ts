import { getMessages } from '@/i18n'
import { buildSearchIndex } from '@/lib/docs/search'
import { getDocsSite } from '@/lib/docs/site'

// /docs/search-index.json, written once by the static export and fetched by the search dialog when it opens.
export const dynamic = 'force-static'

export function GET(): Response {
  const messages = getMessages()
  return Response.json(
    buildSearchIndex(getDocsSite(), { copy: messages.docs.code.copy, apiTitle: messages.docs.api.title }),
  )
}
