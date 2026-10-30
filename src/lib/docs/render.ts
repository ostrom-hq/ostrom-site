import { renderMarkdown, type RenderedMarkdown } from './markdown'
import { pageHref, type DocsVersion } from './site'
import type { DocPage } from './content'

/** An archived version's `/docs/…` links point inside that version; the API reference has no versions. */
export function versionLinks(version: DocsVersion): (href: string) => string {
  if (version.latest) return (href) => href
  return (href) =>
    /^\/docs(?:[/#?]|$)/.test(href) && !/^\/docs\/(?:api|v)(?:[/#?]|$)/.test(href)
      ? `${version.basePath}${href.slice('/docs'.length)}`
      : href
}

const rendered = new Map<string, RenderedMarkdown>()

/** The HTML of a page, rendered once per build (the page and the search index both need it). */
export function renderPage(version: DocsVersion, page: DocPage, copyLabel: string): RenderedMarkdown {
  const key = `${pageHref(version, page.slug)}\n${copyLabel}`
  const known = rendered.get(key)
  if (known !== undefined) return known
  const result = renderMarkdown(page.body, { copyLabel, rewriteHref: versionLinks(version) })
  rendered.set(key, result)
  return result
}
