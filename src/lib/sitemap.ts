// SPDX-License-Identifier: Apache-2.0
import { legalPages, publishedPosts } from './collections'
import { baseSlug } from './content'
import { staticRoutes, type SitemapEntry } from './routes'

/** Every indexable page. Drafts (blog, legal) are built for review but stay out until they are published. */
export function sitemapEntries(): SitemapEntry[] {
  const legal = legalPages()
    .filter((page) => !page.meta.draft)
    .map((page): SitemapEntry => ({
      path: `/legal/${baseSlug(page.slug)}/`,
      priority: 0.2,
      changeFrequency: 'yearly',
    }))
  const posts = publishedPosts().map((post): SitemapEntry => ({
    path: `/blog/${baseSlug(post.slug)}/`,
    priority: 0.5,
    changeFrequency: 'yearly',
  }))
  return [...staticRoutes, ...posts, ...legal]
}
