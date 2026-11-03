// SPDX-License-Identifier: Apache-2.0
// Usage: node scripts/csp.ts <export dir>. Writes the Content-Security-Policy of every exported page (see lib/csp.ts).
// node scripts/csp.ts --connect-src prints the origins the pages connect to, for the image's connect-src header.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { connectOrigins, withPolicy } from './lib/csp.ts'

if (process.argv[2] === '--connect-src') {
  console.log(connectOrigins(process.env).join(' '))
  process.exit(0)
}
const root = process.argv[2] ?? 'out'
let pages = 0
for (const entry of readdirSync(root, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.html')) continue
  const path = join(entry.parentPath, entry.name)
  writeFileSync(path, withPolicy(readFileSync(path, 'utf8')))
  pages += 1
}
console.log(`CSP: policy written in ${String(pages)} pages.`)
