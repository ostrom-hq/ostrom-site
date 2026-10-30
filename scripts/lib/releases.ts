// SPDX-License-Identifier: Apache-2.0
// Turns the GitHub API's releases of each Ostrom repository into content/changelog/releases.json.
import { z } from 'zod'

const githubRelease = z.object({
  tag_name: z.string(),
  name: z.string().nullable(),
  published_at: z.string().nullable(),
  html_url: z.string(),
  body: z.string().nullable(),
  draft: z.boolean(),
})
export type GithubRelease = z.infer<typeof githubRelease>

/** The output of `gh api --paginate --slurp …/releases`: one array per page. */
export function parseGithubPages(json: string): GithubRelease[] {
  const data: unknown = JSON.parse(json)
  return z.array(z.array(githubRelease)).parse(data).flat()
}

export interface ReleaseEntry {
  readonly repository: string
  readonly tag: string
  readonly name: string
  readonly publishedAt: string
  readonly url: string
  readonly body: string
}

export const REPOSITORIES = [
  'ostrom-core',
  'ostrom-cli',
  'ostrom-server',
  'ostrom-web',
  'ostrom-app',
] as const

/** Published releases only (no draft), newest first; a pre-release is kept, its tag says so. */
export function toEntries(repository: string, releases: readonly GithubRelease[]): ReleaseEntry[] {
  return releases.flatMap((release) =>
    release.draft || release.published_at === null
      ? []
      : [
          {
            repository,
            tag: release.tag_name,
            name: release.name ?? release.tag_name,
            publishedAt: release.published_at,
            url: release.html_url,
            body: release.body ?? '',
          },
        ],
  )
}

export function mergeEntries(groups: readonly (readonly ReleaseEntry[])[]): ReleaseEntry[] {
  return groups.flat().toSorted((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}
