// Usage: node scripts/check-links.ts <export dir>. Fails when an internal link or anchor of the export is broken.
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { checkLinks } from './lib/links.ts'

const root = process.argv[2] ?? 'out'
const files = new Map<string, string>()
for (const entry of readdirSync(root, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile()) continue
  const path = join(entry.parentPath, entry.name)
  files.set(relative(root, path).replace(/\\/g, '/'), path.endsWith('.html') ? readFileSync(path, 'utf8') : '')
}
const broken = checkLinks(files, 'https://ostrom.run')
const pages = [...files.keys()].filter((file) => file.endsWith('.html')).length
if (broken.length > 0) {
  for (const link of broken) console.error(`${link.page} → ${link.href} (${link.reason})`)
  console.error(`${String(broken.length)} broken internal link(s) in ${String(pages)} pages.`)
  process.exit(1)
}
console.log(`Links: ${String(pages)} pages, no broken internal link.`)
