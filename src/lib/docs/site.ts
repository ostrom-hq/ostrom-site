// SPDX-License-Identifier: Apache-2.0
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { readApiReference, type ApiReference, type ApiTag } from '@/lib/openapi/reference'
import { site } from '@/lib/site'
import { readContent, type DocFolder, type DocPage } from './content'

// The whole documentation, read once per build: every version's pages and the API reference, with the route of each
// page under /docs/. Everything under content/ is optional: a fresh checkout without the DOCS content still builds.

export const LATEST = 'latest'

const versionsSchema = z
  .array(
    z.object({
      id: z
        .string()
        .regex(/^[a-z0-9][a-z0-9.-]*$/, 'a version id is lowercase letters, digits, dots and dashes'),
      label: z.string().trim().min(1),
    }),
  )
  .refine(
    (versions) => new Set(versions.map((version) => version.id)).size === versions.length,
    'version ids repeat',
  )

export interface DocsVersion {
  readonly id: string
  readonly label: string
  readonly latest: boolean
  /** `/docs` for the latest version, `/docs/v/<id>` for an archived one. */
  readonly basePath: string
  /** The pages, or null when the version has no folder yet. */
  readonly root: DocFolder | null
}

export interface DocsSite {
  readonly versions: readonly DocsVersion[]
  readonly latest: DocsVersion
  readonly api: ApiReference | null
}

export type DocsRoute =
  | { readonly kind: 'page'; readonly version: DocsVersion; readonly page: DocPage }
  /** A version without an index page yet: the docs home says so and lists what there is. */
  | { readonly kind: 'home'; readonly version: DocsVersion }
  | { readonly kind: 'api-overview' }
  | { readonly kind: 'api-tag'; readonly tag: ApiTag }
  | { readonly kind: 'api-schemas' }

/** Where the content lives: `content/` of the repository, or OSTROM_CONTENT_DIR (the tests' fixtures). */
export function contentDir(): string {
  return process.env['OSTROM_CONTENT_DIR'] ?? join(process.cwd(), 'content')
}

type VersionEntry = z.infer<typeof versionsSchema>[number]

const DEFAULT_LATEST: VersionEntry = { id: LATEST, label: 'Latest' }

function readVersions(dir: string): readonly VersionEntry[] {
  const file = join(dir, 'docs-versions.json')
  if (!existsSync(file)) return [DEFAULT_LATEST]
  const parsed = versionsSchema.safeParse(JSON.parse(readFileSync(file, 'utf8')))
  if (!parsed.success) throw new Error(`${file}: ${z.prettifyError(parsed.error)}`)
  return parsed.data
}

function readVersion(dir: string, entry: VersionEntry): DocsVersion {
  const latest = entry.id === LATEST
  return {
    ...entry,
    latest,
    basePath: latest ? '/docs' : `/docs/v/${entry.id}`,
    root: readContent(latest ? join(dir, 'docs') : join(dir, 'docs-versions', entry.id)),
  }
}

/**
 * Reads the documentation under `dir`; `apiUrl` is the API the generated curl examples call. `docs-versions.json`
 * lists the versions (`latest` is content/docs; another id is content/docs-versions/<id>); without the file, or
 * without a `latest` entry in it, the latest version is still there, first.
 */
export function readDocsSite(dir: string, apiUrl: string = site.apiUrl): DocsSite {
  const entries = readVersions(dir)
  const latest = readVersion(dir, entries.find((entry) => entry.id === LATEST) ?? DEFAULT_LATEST)
  const archived = entries.filter((entry) => entry.id !== LATEST).map((entry) => readVersion(dir, entry))
  return {
    versions: [latest, ...archived],
    latest,
    api: readApiReference(join(dir, 'api', 'openapi.yaml'), apiUrl),
  }
}

const cache = new Map<string, DocsSite>()

/** The documentation of this build, read on first use. */
export function getDocsSite(dir: string = contentDir()): DocsSite {
  const known = cache.get(dir)
  if (known !== undefined) return known
  const read = readDocsSite(dir)
  cache.set(dir, read)
  return read
}

/** The URL of a page: `/docs/receipts/format/`, `/docs/v/0.1/quickstart/`. */
export function pageHref(version: DocsVersion, slug: readonly string[]): string {
  return `${[version.basePath, ...slug].join('/')}/`
}

export const API_BASE = '/docs/api'

export function apiTagHref(tag: ApiTag): string {
  return `${API_BASE}/${tag.slug}/`
}

export const API_SCHEMAS_HREF = `${API_BASE}/schemas/`

/** Every page of a folder, in reading order: the folder's index first, then its children, depth first. */
export function pagesOf(folder: DocFolder): DocPage[] {
  const pages = folder.index === null ? [] : [folder.index]
  for (const child of folder.children) pages.push(...(child.kind === 'page' ? [child] : pagesOf(child)))
  return pages
}

function versionRoutes(
  version: DocsVersion,
): { readonly slug: readonly string[]; readonly route: DocsRoute }[] {
  const prefix = version.latest ? [] : ['v', version.id]
  const pages = version.root === null ? [] : pagesOf(version.root)
  const routes = pages.map((page) => ({
    slug: [...prefix, ...page.slug],
    route: { kind: 'page', version, page } as const,
  }))
  const hasHome = pages.some((page) => page.slug.length === 0)
  return hasHome ? routes : [{ slug: prefix, route: { kind: 'home', version } }, ...routes]
}

/** Every route under /docs/, with its slug: what generateStaticParams lists and the sitemap publishes. */
export function docsRoutes(
  docs: DocsSite,
): { readonly slug: readonly string[]; readonly route: DocsRoute }[] {
  const routes = docs.versions.flatMap(versionRoutes)
  routes.push({ slug: ['api'], route: { kind: 'api-overview' } })
  if (docs.api !== null) {
    for (const tag of docs.api.tags) {
      if (tag.slug === 'schemas')
        throw new Error('an API tag named "schemas" would shadow /docs/api/schemas/')
      routes.push({ slug: ['api', tag.slug], route: { kind: 'api-tag', tag } })
    }
    if (docs.api.schemas.length > 0) routes.push({ slug: ['api', 'schemas'], route: { kind: 'api-schemas' } })
  }
  return routes
}

/** The route of a slug, or null for a page that does not exist (a 404). */
export function findRoute(docs: DocsSite, slug: readonly string[]): DocsRoute | null {
  const key = slug.join('/')
  return docsRoutes(docs).find((entry) => entry.slug.join('/') === key)?.route ?? null
}
