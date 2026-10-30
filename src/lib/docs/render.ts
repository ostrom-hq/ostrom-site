// SPDX-License-Identifier: Apache-2.0
import type { Messages } from '@/i18n'
import { renderMarkdown, type MarkdownLabels, type RenderedMarkdown } from './markdown'
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

/** The words of the rendered pages, from the interface texts. */
export function markdownLabels(text: Messages['docs']): MarkdownLabels {
  return { copy: text.code.copy, output: text.code.output, ...text.callouts }
}

const rendered = new Map<string, RenderedMarkdown>()

/** The HTML of a page, rendered once per build (the page and the search index both need it). */
export function renderPage(version: DocsVersion, page: DocPage, labels: MarkdownLabels): RenderedMarkdown {
  const key = `${pageHref(version, page.slug)}\n${JSON.stringify(labels)}`
  const known = rendered.get(key)
  if (known !== undefined) return known
  const result = renderMarkdown(page.body, { labels, rewriteHref: versionLinks(version) })
  rendered.set(key, result)
  return result
}
