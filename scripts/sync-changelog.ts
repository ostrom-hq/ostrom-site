// SPDX-License-Identifier: Apache-2.0
// Usage: node scripts/sync-changelog.ts — reads the releases of every Ostrom repository with the GitHub CLI and writes
// content/changelog/releases.json. Run at each release; the site never calls GitHub at build or at request time.
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { mergeEntries, parseGithubPages, REPOSITORIES, toEntries } from './lib/releases.ts'

const groups = REPOSITORIES.map((repository) => {
  const json = execFileSync(
    'gh',
    ['api', '--paginate', '--slurp', `repos/ostrom-hq/${repository}/releases`],
    {
      encoding: 'utf8',
    },
  )
  return toEntries(repository, parseGithubPages(json))
})
const entries = mergeEntries(groups)
writeFileSync('content/changelog/releases.json', `${JSON.stringify(entries, null, 2)}\n`)
console.log(`Changelog: ${String(entries.length)} releases written.`)
