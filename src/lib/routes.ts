/** Every public page, for the sitemap. A page enters here in the pull request that creates it. */
export interface SitemapEntry {
  readonly path: string
  readonly priority: number
  readonly changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
}

export const staticRoutes: readonly SitemapEntry[] = [
  { path: '/', priority: 1, changeFrequency: 'weekly' },
  { path: '/pricing/', priority: 0.9, changeFrequency: 'monthly' },
]
