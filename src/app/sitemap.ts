// SPDX-License-Identifier: Apache-2.0
import type { MetadataRoute } from 'next'
import { docsSitemapEntries } from '@/lib/docs/sitemap'
import { sitemapEntries } from '@/lib/sitemap'
import { absoluteUrl } from '@/lib/site'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  return [...sitemapEntries(), ...docsSitemapEntries()].map((route) => ({
    url: absoluteUrl(route.path),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}
