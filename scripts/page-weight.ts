// SPDX-License-Identifier: Apache-2.0
// Usage: node scripts/page-weight.ts <export dir> <most elements>. Fails when a page of the export has more elements
// than that: such a page falls under Lighthouse's floor on a phone, and this says so before Lighthouse runs.
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { pageWeights } from './lib/weight.ts'

const root = process.argv[2] ?? 'out'
const most = Number(process.argv[3] ?? '2000')
const pages = new Map<string, string>()
for (const entry of readdirSync(root, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.html')) continue
  const path = join(entry.parentPath, entry.name)
  pages.set(relative(root, path).replace(/\\/g, '/'), readFileSync(path, 'utf8'))
}
const weights = pageWeights(pages)
for (const { page, elements } of weights.slice(0, 5)) console.log(`${String(elements)} elements: ${page}`)
const heavy = weights.filter(({ elements }) => elements > most)
if (heavy.length > 0) {
  for (const { page, elements } of heavy)
    console.error(`${page}: ${String(elements)} elements, at most ${String(most)}`)
  process.exit(1)
}
console.log(`Weight: ${String(pages.size)} pages, none over ${String(most)} elements.`)
