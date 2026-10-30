// SPDX-License-Identifier: Apache-2.0
// Usage: node scripts/defer-runtime.ts <export dir>. Starts Next.js's runtime after the first paint (see lib/defer.ts).
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { deferRuntime } from './lib/defer.ts'

const root = process.argv[2] ?? 'out'
let pages = 0
for (const entry of readdirSync(root, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.html')) continue
  const path = join(entry.parentPath, entry.name)
  writeFileSync(path, deferRuntime(readFileSync(path, 'utf8')))
  pages += 1
}
console.log(`Runtime: deferred in ${String(pages)} pages.`)
