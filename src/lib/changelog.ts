import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { CONTENT_ROOT } from './content'

/** One GitHub release of an Ostrom repository, as `scripts/sync-changelog.ts` writes it. */
export const releaseSchema = z.object({
  repository: z.string().min(1),
  tag: z.string().min(1),
  name: z.string(),
  publishedAt: z.iso.datetime(),
  url: z.url(),
  body: z.string(),
})
export type Release = z.infer<typeof releaseSchema>

const releasesSchema = z.array(releaseSchema)

/** The product names readers know, for the repository of a release. */
export const PRODUCT_OF: Readonly<Record<string, string>> = {
  'ostrom-core': 'Core',
  'ostrom-cli': 'CLI',
  'ostrom-server': 'Server',
  'ostrom-web': 'Console',
  'ostrom-app': 'Mobile app',
}

export function productName(repository: string): string {
  return PRODUCT_OF[repository] ?? repository
}

export function parseReleases(json: string): Release[] {
  const data: unknown = JSON.parse(json)
  return releasesSchema.parse(data).toSorted((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

export function loadReleases(root: string = CONTENT_ROOT): Release[] {
  return parseReleases(readFileSync(join(root, 'changelog', 'releases.json'), 'utf8'))
}

/** Releases grouped by month, newest month first ("October 2026"). */
export function byMonth(
  releases: readonly Release[],
): { readonly month: string; readonly releases: Release[] }[] {
  const groups = new Map<string, Release[]>()
  for (const release of releases) {
    const month = new Date(release.publishedAt).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    })
    const group = groups.get(month)
    if (group === undefined) groups.set(month, [release])
    else group.push(release)
  }
  return [...groups].map(([month, items]) => ({ month, releases: items }))
}
