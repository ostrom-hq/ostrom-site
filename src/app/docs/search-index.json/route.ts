// SPDX-License-Identifier: Apache-2.0
import { getMessages } from '@/i18n'
import { markdownLabels } from '@/lib/docs/render'
import { buildSearchIndex } from '@/lib/docs/search'
import { getDocsSite } from '@/lib/docs/site'

// /docs/search-index.json, written once by the static export and fetched by the search dialog when it opens.
export const dynamic = 'force-static'

export function GET(): Response {
  const messages = getMessages()
  return Response.json(
    buildSearchIndex(getDocsSite(), {
      markdown: markdownLabels(messages.docs),
      apiTitle: messages.docs.api.title,
    }),
  )
}
