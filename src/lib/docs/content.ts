// SPDX-License-Identifier: Apache-2.0
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { z } from '@/lib/zod'
import { captured } from './text'

// The content contract of the DOCS agent (ostrom-site#1, CONTRIBUTING.md): one `.mdx` file per page with a YAML
// frontmatter (title, description, status), pure Markdown without JSX, and a Fumadocs-style `meta.json` per folder
// that orders it (`{"title": "...", "pages": ["index", ...]}`). This module only reads files; nothing here renders.

export const pageStatuses = ['available', 'partial', 'coming-soon'] as const
export type PageStatus = (typeof pageStatuses)[number]

const frontmatterSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  status: z.enum(pageStatuses).default('available'),
})

export type Frontmatter = z.infer<typeof frontmatterSchema>

const metaSchema = z.object({
  title: z.string().trim().min(1).optional(),
  pages: z.array(z.string().min(1)).optional(),
})

export interface DocPage {
  readonly kind: 'page'
  /** Path segments under the version root; a folder's `index` page has the folder's slug. */
  readonly slug: readonly string[]
  readonly file: string
  readonly frontmatter: Frontmatter
  readonly body: string
}

export interface DocFolder {
  readonly kind: 'folder'
  readonly slug: readonly string[]
  readonly title: string
  readonly index: DocPage | null
  /** How many children come before the index in the folder's order: where the sidebar lists it. */
  readonly indexAt: number
  readonly children: readonly DocEntry[]
}

/** A `"---Concepts---"` entry of `meta.json`: a heading of the sidebar that starts a group of pages (PB-D1). */
export interface DocSeparator {
  readonly kind: 'separator'
  readonly title: string
}

export type DocNode = DocPage | DocFolder
export type DocEntry = DocNode | DocSeparator

/** Top-level names that would shadow generated routes: `/docs/api/` (API reference) and `/docs/v/` (versions). */
export const RESERVED_NAMES: readonly string[] = ['api', 'v']

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/
const PAGE_FILE = /^(.+)\.mdx?$/

function problem(file: string, message: string): Error {
  return new Error(`${file}: ${message}`)
}

/** Splits the YAML frontmatter from the Markdown body and checks it against the contract. */
export function readPage(source: string, file: string, slug: readonly string[]): DocPage {
  const match = FRONTMATTER.exec(source)
  if (match === null) throw problem(file, 'the page has no frontmatter (--- title, description, status ---)')
  const parsed = frontmatterSchema.safeParse(parseYaml(captured(match, 1)))
  if (!parsed.success) throw problem(file, `invalid frontmatter: ${z.prettifyError(parsed.error)}`)
  return { kind: 'page', slug, file, frontmatter: parsed.data, body: source.slice(match[0].length) }
}

function readMeta(dir: string): z.infer<typeof metaSchema> {
  const file = join(dir, 'meta.json')
  if (!existsSync(file)) return {}
  const parsed = metaSchema.safeParse(JSON.parse(readFileSync(file, 'utf8')))
  if (!parsed.success) throw problem(file, `invalid meta.json: ${z.prettifyError(parsed.error)}`)
  return parsed.data
}

/** "mcp-and-secrets" → "Mcp and secrets": the title of a folder whose meta.json names none. */
export function titleFromName(name: string): string {
  const words = name.replace(/[-_]+/g, ' ').trim()
  return `${words.charAt(0).toUpperCase()}${words.slice(1)}`
}

/**
 * A sidebar separator, as `docs-tools`' lint reads it: three dashes, a title that does not start with a dash, three
 * dashes (`"---Concepts---"`). Anything else in `pages` is the name of a page or a folder.
 */
const SEPARATOR = /^---([^-].*)---$/

/** The heading of a separator entry, or null when the entry names a page or a folder. */
export function separatorTitle(entry: string): string | null {
  const match = SEPARATOR.exec(entry)
  return match === null ? null : captured(match, 1).trim()
}

/**
 * Reads a folder of pages. Order: the names of `meta.json`'s `pages`, with its separators in place, then every other
 * page or folder alphabetically, so that a page missing from meta.json is shown rather than lost. A listed name with
 * no file fails the build.
 */
export function readFolder(dir: string, slug: readonly string[] = []): DocFolder {
  const meta = readMeta(dir)
  const entries = new Map<string, { readonly path: string; readonly folder: boolean }>()
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const page = PAGE_FILE.exec(entry.name)
    if (entry.isDirectory()) entries.set(entry.name, { path: join(dir, entry.name), folder: true })
    else if (page !== null) entries.set(captured(page, 1), { path: join(dir, entry.name), folder: false })
  }
  const pages = meta.pages ?? []
  const listed = pages.filter((name) => separatorTitle(name) === null)
  for (const name of listed) {
    if (!entries.has(name))
      throw problem(join(dir, 'meta.json'), `"${name}" is listed, but there is no ${name}.mdx or ${name}/`)
  }
  // meta.json's order with its separators in place, a name listed twice once, then the unlisted names.
  const sequence: (string | DocSeparator)[] = [
    ...pages.map((name): string | DocSeparator => {
      const title = separatorTitle(name)
      return title === null ? name : { kind: 'separator', title }
    }),
    ...[...entries.keys()].filter((name) => !listed.includes(name)).sort((a, b) => a.localeCompare(b)),
  ]

  let index: DocPage | null = null
  let indexAt = 0
  const seen = new Set<string>()
  const children: DocEntry[] = []
  for (const item of sequence) {
    if (typeof item !== 'string') {
      children.push(item)
      continue
    }
    const entry = entries.get(item)
    if (entry === undefined || seen.has(item)) continue
    seen.add(item)
    if (slug.length === 0 && RESERVED_NAMES.includes(item)) {
      throw problem(
        entry.path,
        `"${item}" is reserved for a generated route of /docs/; rename the page or folder`,
      )
    }
    if (entry.folder) {
      children.push(readFolder(entry.path, [...slug, item]))
    } else if (item === 'index') {
      index = readPage(readFileSync(entry.path, 'utf8'), entry.path, slug)
      // An index left out of meta.json comes first, before any separator.
      indexAt = listed.includes(item) ? children.length : 0
    } else {
      children.push(readPage(readFileSync(entry.path, 'utf8'), entry.path, [...slug, item]))
    }
  }
  return {
    kind: 'folder',
    slug,
    title: meta.title ?? titleFromName(slug.at(-1) ?? 'docs'),
    index,
    indexAt,
    children,
  }
}

/** Reads a version's pages, or null when its folder does not exist (the DOCS content is not merged yet). */
export function readContent(dir: string): DocFolder | null {
  return existsSync(dir) ? readFolder(dir) : null
}
