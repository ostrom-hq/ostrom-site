// Internal link checker for the static export: every href/src that stays on the site must lead to a file, and every
// #fragment to an element id of the target page. External links are listed, not fetched (CI has no network promise).

export interface BrokenLink {
  readonly page: string
  readonly href: string
  readonly reason: 'missing-page' | 'missing-anchor'
}

const ATTRIBUTE = /\s(?:href|src)="([^"]*)"/g
const ID = /\sid="([^"]*)"/g

/** The site path a file is served at: `pricing/index.html` → `/pricing/`. */
export function pathOfFile(file: string): string {
  const normalized = file.replace(/\\/g, '/').replace(/^\/+/, '')
  if (normalized === 'index.html') return '/'
  if (normalized.endsWith('/index.html')) return `/${normalized.slice(0, -'index.html'.length)}`
  return `/${normalized}`
}

/** The file that serves a site path, following nginx's try_files ($uri, $uri/index.html, $uri.html). */
export function resolvePath(path: string, files: ReadonlySet<string>): string | null {
  const clean = decodeURIComponent(path).replace(/^\/+/, '')
  const candidates =
    clean === '' || clean.endsWith('/')
      ? [`${clean}index.html`]
      : [clean, `${clean}/index.html`, `${clean}.html`]
  return candidates.find((candidate) => files.has(candidate)) ?? null
}

export function extractLinks(html: string): string[] {
  return [...html.matchAll(ATTRIBUTE)].map((match) => (match[1] ?? '').replace(/&amp;/g, '&'))
}

export function extractIds(html: string): Set<string> {
  return new Set([...html.matchAll(ID)].map((match) => match[1] ?? ''))
}

/** Checks every HTML page of `files` (path relative to the export root → content; non-HTML content may be empty). */
export function checkLinks(files: ReadonlyMap<string, string>, siteOrigin: string): BrokenLink[] {
  const names = new Set(files.keys())
  const broken: BrokenLink[] = []
  for (const [file, html] of files) {
    if (!file.endsWith('.html')) continue
    const pagePath = pathOfFile(file)
    for (const raw of extractLinks(html)) {
      if (raw === '' || /^(?:mailto:|tel:|data:|javascript:)/i.test(raw)) continue
      const url = new URL(raw, `${siteOrigin}${pagePath}`)
      if (url.origin !== siteOrigin) continue
      const target = resolvePath(url.pathname, names)
      if (target === null) {
        broken.push({ page: pagePath, href: raw, reason: 'missing-page' })
        continue
      }
      const anchor = decodeURIComponent(url.hash.slice(1))
      if (anchor !== '' && target.endsWith('.html') && !extractIds(files.get(target) ?? '').has(anchor)) {
        broken.push({ page: pagePath, href: raw, reason: 'missing-anchor' })
      }
    }
  }
  return broken
}
