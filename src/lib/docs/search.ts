import { collapseWhitespace, truncate } from './text'
import { SECTION_TEXT_LIMIT } from './markdown'
import { renderPage } from './render'
import { apiTagHref, docsRoutes, pageHref, type DocsSite } from './site'
import type { SearchEntry, SearchIndex } from './searchIndex'

// The search index: one entry per section of every page (and per operation of the API reference), built at build
// time into /docs/search-index.json. The dialog fetches it only when someone opens it.

export {
  SEARCH_INDEX_PATH,
  searchEntrySchema,
  searchIndexSchema,
  type SearchEntry,
  type SearchIndex,
} from './searchIndex'

type Draft = Omit<SearchEntry, 'id'>

/** Builds the index of every version; `copyLabel` only has to match the pages' so their rendering is reused. */
export function buildSearchIndex(
  docs: DocsSite,
  labels: { readonly copy: string; readonly apiTitle: string },
): SearchIndex {
  const drafts: Draft[] = []
  for (const { route } of docsRoutes(docs)) {
    if (route.kind === 'page') {
      const { page, version } = route
      const href = pageHref(version, page.slug)
      const title = page.frontmatter.title
      const sections = renderPage(version, page, labels.copy).sections
      // The text before the first heading belongs to the page entry itself, with the description.
      const preface = sections.filter((section) => section.id === null).map((section) => section.text)
      drafts.push({
        version: version.id,
        href,
        title,
        section: '',
        text: truncate([page.frontmatter.description, ...preface].join(' '), SECTION_TEXT_LIMIT),
      })
      for (const section of sections) {
        if (section.id === null) continue
        drafts.push({
          version: version.id,
          href: `${href}#${section.id}`,
          title,
          section: section.title,
          text: section.text,
        })
      }
    } else if (route.kind === 'api-tag') {
      const { tag } = route
      for (const operation of tag.operations) {
        drafts.push({
          version: docs.latest.id,
          href: `${apiTagHref(tag)}#${operation.anchor}`,
          title: `${labels.apiTitle} · ${tag.title}`,
          section: operation.summary,
          text: truncate(
            collapseWhitespace(
              [
                `${operation.method.toUpperCase()} ${operation.path}`,
                operation.description ?? '',
                ...operation.parameters.map((parameter) => parameter.name),
              ].join(' '),
            ),
            SECTION_TEXT_LIMIT,
          ),
        })
      }
    }
  }
  return { entries: drafts.map((draft, id) => ({ id, ...draft })) }
}
