// The local twin of docker/nginx.conf, for Playwright and Lighthouse runs without Docker.
import { resolvePath } from './links.ts'

const TYPES: Readonly<Record<string, string>> = {
  html: 'text/html; charset=utf-8',
  css: 'text/css; charset=utf-8',
  js: 'application/javascript; charset=utf-8',
  json: 'application/json',
  svg: 'image/svg+xml',
  png: 'image/png',
  ico: 'image/x-icon',
  woff2: 'font/woff2',
  xml: 'application/xml',
  txt: 'text/plain; charset=utf-8',
  webmanifest: 'application/manifest+json',
}

export function contentType(file: string): string {
  const extension = file.slice(file.lastIndexOf('.') + 1).toLowerCase()
  return TYPES[extension] ?? 'application/octet-stream'
}

export interface StaticAnswer {
  readonly status: 200 | 404
  readonly file: string | null
}

/** Which file answers a request path: the page, else the 404 page with status 404. */
export function answer(pathname: string, files: ReadonlySet<string>): StaticAnswer {
  if (pathname.includes('..')) return { status: 404, file: files.has('404.html') ? '404.html' : null }
  const file = resolvePath(pathname, files)
  if (file !== null) return { status: 200, file }
  return { status: 404, file: files.has('404.html') ? '404.html' : null }
}
