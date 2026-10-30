// SPDX-License-Identifier: Apache-2.0
import { isPublished, type ApiReference } from '@/lib/openapi/reference'
import type { DocFolder, DocPage, DocSeparator, PageStatus } from './content'
import { API_BASE, API_SCHEMAS_HREF, apiTagHref, pageHref, type DocsVersion } from './site'

// The navigation of the docs, as plain data for the components: the sidebar tree, the reading order (previous and
// next), and the breadcrumbs. The page being read is matched by its URL.

export interface NavLink {
  readonly kind: 'link'
  readonly title: string
  readonly href: string
  readonly status: PageStatus
}

export interface NavGroup {
  readonly kind: 'group'
  readonly title: string
  /** The group's own page (its `index`), or null for a plain heading. */
  readonly href: string | null
  readonly status: PageStatus
  readonly items: readonly NavEntry[]
}

/** A heading of the sidebar (a `"---Concepts---"` separator of meta.json) and the entries under it, up to the next. */
export interface NavSection {
  readonly kind: 'section'
  readonly title: string
  readonly items: readonly NavEntry[]
}

export type NavEntry = NavLink | NavGroup | NavSection

export interface NavLabels {
  readonly apiReference: string
  readonly apiOverview: string
  readonly schemas: string
}

function link(version: DocsVersion, page: DocPage): NavLink {
  return {
    kind: 'link',
    title: page.frontmatter.title,
    href: pageHref(version, page.slug),
    status: page.frontmatter.status,
  }
}

/** Cuts a list at its separators: what comes before the first stays at the top, each separator starts a section. */
function sectioned(list: readonly (NavLink | NavGroup | DocSeparator)[]): NavEntry[] {
  const entries: NavEntry[] = []
  let section: NavEntry[] | null = null
  for (const item of list) {
    if (item.kind === 'separator') {
      section = []
      entries.push({ kind: 'section', title: item.title, items: section })
    } else if (section === null) {
      entries.push(item)
    } else {
      section.push(item)
    }
  }
  // A separator with nothing under it (the last entry of meta.json) is no heading.
  return entries.filter((entry) => entry.kind !== 'section' || entry.items.length > 0)
}

/** A folder's entries; `index` (the root's own page) goes where meta.json lists it. */
function folderEntries(version: DocsVersion, folder: DocFolder, index: NavLink | null): NavEntry[] {
  const list = folder.children.map((child): NavLink | NavGroup | DocSeparator => {
    if (child.kind === 'separator') return child
    if (child.kind === 'page') return link(version, child)
    return {
      kind: 'group',
      title: child.title,
      href: child.index === null ? null : pageHref(version, child.slug),
      status: child.index === null ? 'available' : child.index.frontmatter.status,
      items: folderEntries(version, child, null),
    }
  })
  if (index !== null) list.splice(folder.indexAt, 0, index)
  return sectioned(list)
}

/** The API reference as a sidebar group: overview, one entry per tag, the schemas. Latest version only. */
export function apiGroup(api: ApiReference | null, labels: NavLabels): NavGroup {
  const published = api !== null && isPublished(api)
  const status = published ? 'available' : 'coming-soon'
  const items: NavEntry[] = [{ kind: 'link', title: labels.apiOverview, href: `${API_BASE}/`, status }]
  if (published) {
    for (const tag of api.tags)
      items.push({ kind: 'link', title: tag.title, href: apiTagHref(tag), status: 'available' })
    if (api.schemas.length > 0)
      items.push({ kind: 'link', title: labels.schemas, href: API_SCHEMAS_HREF, status: 'available' })
  }
  return { kind: 'group', title: labels.apiReference, href: null, status, items }
}

/**
 * The sidebar of a version: its pages and folders in meta.json's order, its separators as section headings, then
 * (latest only) the API reference.
 */
export function sidebar(version: DocsVersion, api: ApiReference | null, labels: NavLabels): NavEntry[] {
  const root = version.root
  const entries: NavEntry[] =
    root === null ? [] : folderEntries(version, root, root.index === null ? null : link(version, root.index))
  if (version.latest) entries.push(apiGroup(api, labels))
  return entries
}

/** Every page of the sidebar in reading order, for previous and next. */
export function readingOrder(
  entries: readonly NavEntry[],
): { readonly title: string; readonly href: string }[] {
  return entries.flatMap((entry) => {
    if (entry.kind === 'section') return readingOrder(entry.items)
    const own = entry.href === null ? [] : [{ title: entry.title, href: entry.href }]
    return entry.kind === 'link' ? own : [...own, ...readingOrder(entry.items)]
  })
}

export interface Pager {
  readonly previous: { readonly title: string; readonly href: string } | null
  readonly next: { readonly title: string; readonly href: string } | null
}

export function pager(entries: readonly NavEntry[], href: string): Pager {
  const order = readingOrder(entries)
  const position = order.findIndex((entry) => entry.href === href)
  if (position === -1) return { previous: null, next: null }
  return { previous: order[position - 1] ?? null, next: order[position + 1] ?? null }
}

/** True when the entry is the page at `href` or a group that contains it: the sidebar opens down to the page. */
export function containsHref(entry: NavEntry, href: string): boolean {
  if (entry.kind !== 'section' && entry.href === href) return true
  return entry.kind !== 'link' && entry.items.some((item) => containsHref(item, href))
}

export interface Crumb {
  readonly title: string
  readonly href: string | null
}

/**
 * The path from the docs home to `href`: each group of the sidebar that contains it, then the page itself. A section
 * heading is no place to go back to: it is not a crumb.
 */
export function breadcrumbs(home: Crumb, entries: readonly NavEntry[], href: string): Crumb[] {
  for (const entry of entries) {
    if (!containsHref(entry, href)) continue
    if (entry.kind === 'section') return breadcrumbs(home, entry.items, href)
    const own: Crumb = { title: entry.title, href: entry.href === href ? null : entry.href }
    if (entry.kind === 'link' || entry.href === href) return [home, own]
    return [home, ...breadcrumbs(own, entry.items, href)]
  }
  return [home]
}
