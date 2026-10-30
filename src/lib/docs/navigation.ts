import { isPublished, type ApiReference } from '@/lib/openapi/reference'
import type { DocFolder, DocPage, PageStatus } from './content'
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

export type NavEntry = NavLink | NavGroup

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

function folderEntries(version: DocsVersion, folder: DocFolder): NavEntry[] {
  return folder.children.map((child): NavEntry => {
    if (child.kind === 'page') return link(version, child)
    return {
      kind: 'group',
      title: child.title,
      href: child.index === null ? null : pageHref(version, child.slug),
      status: child.index === null ? 'available' : child.index.frontmatter.status,
      items: folderEntries(version, child),
    }
  })
}

/** The API reference as a sidebar group: overview, one entry per tag, the schemas. Latest version only. */
export function apiGroup(api: ApiReference | null, labels: NavLabels): NavGroup {
  const published = isPublished(api)
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

/** The sidebar of a version: its root index first, its pages and folders, then (latest only) the API reference. */
export function sidebar(version: DocsVersion, api: ApiReference | null, labels: NavLabels): NavEntry[] {
  const root = version.root
  const entries: NavEntry[] = []
  if (root !== null) {
    if (root.index !== null) entries.push(link(version, root.index))
    entries.push(...folderEntries(version, root))
  }
  if (version.latest) entries.push(apiGroup(api, labels))
  return entries
}

/** Every page of the sidebar in reading order, for previous and next. */
export function readingOrder(
  entries: readonly NavEntry[],
): { readonly title: string; readonly href: string }[] {
  return entries.flatMap((entry) => {
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
  if (entry.href === href) return true
  return entry.kind === 'group' && entry.items.some((item) => containsHref(item, href))
}

export interface Crumb {
  readonly title: string
  readonly href: string | null
}

/** The path from the docs home to `href`: each group of the sidebar that contains it, then the page itself. */
export function breadcrumbs(home: Crumb, entries: readonly NavEntry[], href: string): Crumb[] {
  for (const entry of entries) {
    if (!containsHref(entry, href)) continue
    const own: Crumb = { title: entry.title, href: entry.href === href ? null : entry.href }
    if (entry.kind === 'link' || entry.href === href) return [home, own]
    return [home, ...breadcrumbs(own, entry.items, href)]
  }
  return [home]
}
