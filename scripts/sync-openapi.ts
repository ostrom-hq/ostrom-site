// Usage: node scripts/sync-openapi.ts [--from <path> | --ref <ref>]. Copies ostrom-core's api/openapi.yaml into
// content/api/openapi.yaml, the source of /docs/api/. Without arguments it reads ostrom-core's main through `gh`.
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { parseArguments, syncOpenApi } from './lib/openapi-sync.ts'

const report = syncOpenApi(parseArguments(process.argv.slice(2)), {
  readFile: (path) => readFileSync(path, 'utf8'),
  runGh: (args) => execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }),
  writeFile: (path, text) => {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, text)
  },
})
console.log(report)
