/** Every public page, for the sitemap. A page enters here in the pull request that creates it. */
export interface SitemapEntry {
  readonly path: string
  readonly priority: number
  readonly changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
}

export const staticRoutes: readonly SitemapEntry[] = [
  { path: '/', priority: 1, changeFrequency: 'weekly' },
  { path: '/pricing/', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/security/', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/open-source/', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/compare/', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/blog/', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/changelog/', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/status/', priority: 0.3, changeFrequency: 'daily' },
  { path: '/legal/', priority: 0.2, changeFrequency: 'yearly' },
]
