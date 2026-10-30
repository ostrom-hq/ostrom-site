// SPDX-License-Identifier: Apache-2.0
import GithubSlugger from 'github-slugger'
import type { Element, ElementContent, Root, RootContent } from 'hast'
import { toHtml } from 'hast-util-to-html'
import { toString } from 'hast-util-to-string'
import type { Code, Table } from 'mdast'
import { defaultHandlers, type State } from 'mdast-util-to-hast'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { codeBlock } from './code'
import { collapseWhitespace, truncate } from './text'

/** A heading of the page, for the table of contents. */
export interface TocItem {
  readonly id: string
  readonly text: string
  readonly depth: 2 | 3
}

/** A part of the page under one heading (`id` null and no title: the text before the first heading), for search. */
export interface PageSection {
  readonly id: string | null
  readonly title: string
  readonly text: string
}

export interface RenderedMarkdown {
  readonly html: string
  readonly toc: readonly TocItem[]
  readonly sections: readonly PageSection[]
}

export interface MarkdownOptions {
  readonly copyLabel: string
  /** Rewrites every link of the page; an archived version points its `/docs/…` links at itself. */
  readonly rewriteHref: (href: string) => string
}

/** The longest text a search entry keeps of a section: enough to match on, small enough for the index. */
export const SECTION_TEXT_LIMIT = 1600

const HEADING = /^h([1-6])$/

function element(tagName: string, className: string, children: ElementContent[]): Element {
  return { type: 'element', tagName, properties: { className: [className] }, children }
}

function eachElement(nodes: readonly (RootContent | ElementContent)[], visit: (node: Element) => void): void {
  for (const node of nodes) {
    if (node.type !== 'element') continue
    visit(node)
    eachElement(node.children, visit)
  }
}

function toHast(markdown: string, copyLabel: string): Root {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, {
      handlers: {
        code: (_state: State, node: Code): Element =>
          codeBlock(node.value, { language: node.lang, meta: node.meta, copyLabel }),
        // A wide table scrolls inside its own frame, never the page.
        table: (state: State, node: Table): Element =>
          element('div', 'table-wrap', [defaultHandlers.table(state, node)]),
      },
    })
  return processor.runSync(processor.parse(markdown))
}

/**
 * Renders the Markdown body of a page (GFM, no HTML, no JSX) to HTML at build time. Headings get the GitHub slug as
 * their id and become links to themselves; h2 and h3 make the table of contents and cut the page into search sections.
 * Raw HTML in the source is dropped, never passed through, so the HTML is safe to inline.
 */
export function renderMarkdown(markdown: string, options: MarkdownOptions): RenderedMarkdown {
  const tree = toHast(markdown, options.copyLabel)
  const slugger = new GithubSlugger()
  const toc: TocItem[] = []
  const sections: PageSection[] = []
  let current: { id: string | null; title: string; parts: string[] } = { id: null, title: '', parts: [] }
  const close = (): void => {
    const text = truncate(collapseWhitespace(current.parts.join(' ')), SECTION_TEXT_LIMIT)
    if (current.id !== null || text !== '') sections.push({ id: current.id, title: current.title, text })
  }

  for (const node of tree.children) {
    const level = node.type === 'element' ? HEADING.exec(node.tagName) : null
    if (node.type !== 'element' || level === null) {
      current.parts.push(toString(node))
      continue
    }
    const title = collapseWhitespace(toString(node))
    const id = slugger.slug(title)
    node.properties = { ...node.properties, id }
    node.children = [
      { type: 'element', tagName: 'a', properties: { href: `#${id}` }, children: node.children },
    ]
    const depth = Number(level[1])
    if (depth === 2 || depth === 3) {
      toc.push({ id, text: title, depth })
      close()
      current = { id, title, parts: [] }
    } else {
      current.parts.push(title)
    }
  }
  close()

  eachElement(tree.children, (node) => {
    const { href } = node.properties
    if (node.tagName === 'a' && typeof href === 'string')
      node.properties = { ...node.properties, href: options.rewriteHref(href) }
  })

  return { html: toHtml(tree), toc, sections }
}
