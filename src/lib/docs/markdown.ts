// SPDX-License-Identifier: Apache-2.0
import GithubSlugger from 'github-slugger'
import type { Element, ElementContent, Root, RootContent } from 'hast'
import { toHtml } from 'hast-util-to-html'
import { toString } from 'hast-util-to-string'
import type { Blockquote, Code, Root as MdastRoot, RootContent as MdastContent, Table } from 'mdast'
import { defaultHandlers, type State } from 'mdast-util-to-hast'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { codeBlock, metaAttribute } from './code'
import { captured, collapseWhitespace, truncate } from './text'

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

/** The words the rendered page shows around the content: copy buttons, output blocks, callout titles. */
export interface MarkdownLabels {
  readonly copy: string
  readonly output: string
  readonly note: string
  readonly warning: string
  readonly caution: string
}

export interface MarkdownOptions {
  readonly labels: MarkdownLabels
  /** Rewrites every link of the page; an archived version points its `/docs/…` links at itself. */
  readonly rewriteHref: (href: string) => string
}

/**
 * The callouts a page may use, as GitHub alerts (`> [!NOTE]`), and the label each one shows: the three kinds of
 * `docs-tools`' lint (PB-DP6). Another marker (`[!TIP]`, which the lint refuses) stays a plain quote.
 */
export const CALLOUTS = { NOTE: 'note', WARNING: 'warning', CAUTION: 'caution' } as const

type CalloutKind = (typeof CALLOUTS)[keyof typeof CALLOUTS]

/** The schemes a link or an image may use; a URL without a scheme (relative, `#anchor`, `//host`) is kept too. */
const SAFE_SCHEMES: readonly string[] = ['http', 'https', 'mailto']

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

/**
 * Whether a link or an image may point there: http, https, mailto or no scheme at all. Browsers ignore control
 * characters and spaces in a scheme (`java\tscript:`), so they are dropped before it is read.
 */
export function isSafeUrl(url: string): boolean {
  // Every character but the printable ASCII (`!` to `~`) and non-ASCII: spaces, control characters, DEL.
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(url.replace(/[^!-~\u0080-\uffff]/g, ''))
  return scheme === null || SAFE_SCHEMES.includes(captured(scheme, 1).toLowerCase())
}

/** One block of a tab set: which set (numbered in the page), and the name of its tab. */
interface TabMember {
  readonly set: number
  readonly tab: string
  readonly group: string
}

function tabOf(node: MdastContent): { readonly tab: string; readonly group: string } | null {
  if (node.type !== 'code') return null
  const tab = metaAttribute(node.meta ?? '', 'tab')
  const group = metaAttribute(node.meta ?? '', 'group')
  if (typeof tab !== 'string' || typeof group !== 'string' || tab.trim() === '' || group.trim() === '') return null
  return { tab: tab.trim(), group: group.trim() }
}

/**
 * Finds the tab sets of a page as `docs-tools`' lint does (PB-DP3): consecutive code blocks (nothing but blank lines
 * between them) with the same `group`, each with its `tab`. A lone tabbed block is no set and stays a plain block.
 */
function findTabSets(node: MdastRoot | MdastContent, sets: Map<Code, TabMember>, count: { value: number }): void {
  if (!('children' in node)) return
  let run: { readonly node: Code; readonly tab: string; readonly group: string }[] = []
  const close = (): void => {
    if (run.length > 1) {
      count.value += 1
      for (const member of run) sets.set(member.node, { set: count.value, tab: member.tab, group: member.group })
    }
    run = []
  }
  for (const child of node.children) {
    const tab = tabOf(child)
    if (tab === null || child.type !== 'code') {
      close()
      findTabSets(child, sets, count)
      continue
    }
    if (run[0] !== undefined && run[0].group !== tab.group) close()
    run.push({ node: child, ...tab })
  }
  close()
}

/** A tabbed block's first line names its tab for GitHub's readers (`# macOS`); inside the tab it is dropped. */
export function dropTabComment(code: string, tab: string): string {
  const [first = '', ...rest] = code.split('\n')
  const comment = /^\s*(?:#|\/\/|--|;)\s*(.*?)\s*$/.exec(first)
  return comment !== null && captured(comment, 1).toLowerCase() === tab.toLowerCase() ? rest.join('\n') : code
}

/** The kind of a GitHub alert (`> [!NOTE]` alone on the quote's first line), its marker taken out of the quote. */
function takeCallout(node: Blockquote): CalloutKind | null {
  const paragraph = node.children[0]
  if (paragraph?.type !== 'paragraph') return null
  const first = paragraph.children[0]
  if (first?.type !== 'text') return null
  const marker = /^\[!([A-Z]+)\][ \t]*(?:\n|$)/.exec(first.value)
  const kind = marker === null ? undefined : Object.entries(CALLOUTS).find(([name]) => name === marker[1])?.[1]
  if (marker === null || kind === undefined) return null
  first.value = first.value.slice(marker[0].length)
  if (first.value === '') paragraph.children.shift()
  if (paragraph.children.length === 0) node.children.shift()
  return kind
}

function toHast(markdown: string, labels: MarkdownLabels): Root {
  const processor = unified().use(remarkParse).use(remarkGfm)
  const tree = processor.parse(markdown)
  const tabs = new Map<Code, TabMember>()
  findTabSets(tree, tabs, { value: 0 })
  const rehype = unified().use(remarkRehype, {
    handlers: {
      code: (_state: State, node: Code): Element => {
        const member = tabs.get(node)
        const block = codeBlock(member === undefined ? node.value : dropTabComment(node.value, member.tab), {
          language: node.lang,
          meta: node.meta,
          copyLabel: labels.copy,
          outputLabel: labels.output,
        })
        if (member !== undefined)
          block.properties = { ...block.properties, dataTabSet: String(member.set), dataTab: member.tab, dataGroup: member.group }
        return block
      },
      // A GitHub alert is an aside with its title; any other quote stays a quote.
      blockquote: (state: State, node: Blockquote): Element => {
        const kind = takeCallout(node)
        const quote = defaultHandlers.blockquote(state, node)
        if (kind === null) return quote
        return {
          type: 'element',
          tagName: 'aside',
          properties: { className: ['docs-callout', `docs-callout--${kind}`] },
          children: [element('p', 'docs-callout__title', [{ type: 'text', value: labels[kind] }]), ...quote.children],
        }
      },
      // A wide table scrolls inside its own frame, never the page.
      table: (state: State, node: Table): Element =>
        element('div', 'table-wrap', [defaultHandlers.table(state, node)]),
    },
  })
  return rehype.runSync(tree)
}

const isBlank = (node: ElementContent): boolean => node.type === 'text' && node.value.trim() === ''
const isElementContent = (node: RootContent): node is ElementContent => node.type !== 'doctype'

interface Tabbed {
  readonly block: Element
  readonly set: string
  readonly tab: string
  readonly group: string
}

/** A block of a tab set (the code handler marked it), or null for any other node. */
function tabbed(node: ElementContent): Tabbed | null {
  if (node.type !== 'element') return null
  const { dataTabSet: set, dataTab: tab, dataGroup: group, ...properties } = node.properties
  if (typeof set !== 'string' || typeof tab !== 'string' || typeof group !== 'string') return null
  return { block: { ...node, properties }, set, tab, group }
}

/** A tab set's block as a panel, its tab's name above it. */
function panel({ block, tab: name }: Tabbed): Element {
  return {
    type: 'element',
    tagName: 'div',
    properties: { className: ['docs-tabs__panel'], dataTab: name },
    children: [element('p', 'docs-tabs__label', [{ type: 'text', value: name }]), block],
  }
}

/**
 * Gathers each tab set's blocks into one frame: a panel per block, with its tab's name above it. That is the page
 * without a script (every panel shown, each one labelled); TabsListener turns it into tabs once the runtime runs.
 */
function groupTabs(children: readonly ElementContent[]): ElementContent[] {
  const result: ElementContent[] = []
  // The set being gathered: its number, and the frame its panels go in.
  let set: string | null = null
  let frame: Element[] = []
  for (const node of children) {
    const member = tabbed(node)
    if (member === null) {
      // The line breaks between two blocks of a set are not content; anything else ends the set.
      if (set !== null && isBlank(node)) continue
      set = null
      result.push(node)
      continue
    }
    if (set !== member.set) {
      frame = []
      result.push({
        type: 'element',
        tagName: 'div',
        properties: { className: ['docs-tabs'], dataTabs: member.group },
        children: frame,
      })
      set = member.set
    }
    frame.push(panel(member))
  }
  return result
}

/**
 * Links and images point only at http, https, mailto or a URL without a scheme; anything else (`javascript:`,
 * `data:`) is dropped: the link keeps its text, the image becomes its alt text.
 */
function dropUnsafeUrls(node: Element): void {
  const attribute = node.tagName === 'a' ? 'href' : node.tagName === 'img' ? 'src' : null
  if (attribute === null) return
  const url = node.properties[attribute]
  if (typeof url !== 'string' || isSafeUrl(url)) return
  if (node.tagName === 'img') {
    const alt = node.properties.alt
    node.children = typeof alt === 'string' && alt !== '' ? [{ type: 'text', value: alt }] : []
  }
  node.tagName = 'span'
  node.properties = {}
}

/**
 * Renders the Markdown body of a page (GFM, no HTML, no JSX) to HTML at build time. Headings get the GitHub slug as
 * their id and become links to themselves; h2 and h3 make the table of contents and cut the page into search sections.
 * GitHub alerts become callouts and tab sets become tabs. Raw HTML in the source is dropped, never passed through,
 * and links keep only safe schemes, so the HTML is safe to inline.
 */
export function renderMarkdown(markdown: string, options: MarkdownOptions): RenderedMarkdown {
  const tree = toHast(markdown, options.labels)
  tree.children = groupTabs(tree.children.filter(isElementContent))
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
    node.children = groupTabs(node.children)
    dropUnsafeUrls(node)
    const { href } = node.properties
    if (node.tagName === 'a' && typeof href === 'string')
      node.properties = { ...node.properties, href: options.rewriteHref(href) }
  })

  return { html: toHtml(tree), toc, sections }
}
