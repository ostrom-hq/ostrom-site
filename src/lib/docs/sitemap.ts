// SPDX-License-Identifier: Apache-2.0
import type { SitemapEntry } from '@/lib/routes'
import { docsRoutes, getDocsSite, type DocsSite } from './site'

/** The URL path of a route slug under /docs/: `[]` → `/docs/`, `['api', 'gates']` → `/docs/api/gates/`. */
export function docsPath(slug: readonly string[]): string {
  return `${['/docs', ...slug].join('/')}/`
}

/** Every docs page for the sitemap: the guides weekly, the generated API reference with each contract change. */
export function docsSitemapEntries(docs: DocsSite = getDocsSite()): SitemapEntry[] {
  return docsRoutes(docs).map(({ slug, route }) => ({
    path: docsPath(slug),
    priority: route.kind === 'page' || route.kind === 'home' ? 0.7 : 0.6,
    changeFrequency: 'weekly',
  }))
}
