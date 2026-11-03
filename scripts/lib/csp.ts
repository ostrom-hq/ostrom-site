// SPDX-License-Identifier: Apache-2.0
// A Content-Security-Policy per page of the static export: scripts only from the site itself, plus the inline scripts
// Next.js writes into each page (the theme boot script, the React payload), allowed by their exact SHA-256. The policy
// goes in a <meta> right after the charset, before any script; nginx adds the header-only directives (frame-ancestors).
import { createHash } from 'node:crypto'
import { orEmpty } from './links.ts'

const SCRIPT = /<script\b([^>]*)>([\s\S]*?)<\/script>/g
/** Scripts the browser never runs: data blocks such as JSON-LD. */
const DATA_TYPE = /\btype=["']?application\/(?:ld\+)?json/i

/** The text of every inline script the browser would run. */
export function inlineScripts(html: string): string[] {
  return [...html.matchAll(SCRIPT)].flatMap((match) => {
    const attributes = orEmpty(match[1])
    return /\bsrc=/.test(attributes) || DATA_TYPE.test(attributes) ? [] : [orEmpty(match[2])]
  })
}

export function sha256(text: string): string {
  return `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`
}

/**
 * Everything from the site itself; scripts only by file or by exact hash, never inline or eval. Styles may be inline (a
 * style attribute runs no code). `connect-src` allows any https host here because the analytics host is only known when
 * the container starts: the header nginx adds (docker/site-config.sh) narrows it to the console, the API and that host,
 * and the browser enforces both policies.
 */
export function policyFor(html: string): string {
  const hashes = [...new Set(inlineScripts(html).map(sha256))]
  return [
    "default-src 'self'",
    `script-src 'self' ${hashes.join(' ')}`.trim(),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "connect-src 'self' https:",
    "object-src 'none'",
    "base-uri 'self'",
  ].join('; ')
}

/** The build's public environment, as `readSiteConfig` (src/lib/site.ts) reads it. */
export type BuildEnvironment = Readonly<Record<string, string | undefined>>

/**
 * The origins the pages connect to besides the site: the console and the API, which the status page probes. Same
 * defaults as `readSiteConfig`; the image writes them at build for docker/site-config.sh.
 */
export function connectOrigins(environment: BuildEnvironment): string[] {
  const urls = [
    environment['NEXT_PUBLIC_APP_URL'] ?? 'https://app.ostrom.run',
    environment['NEXT_PUBLIC_API_URL'] ?? 'https://api.ostrom.run',
  ]
  return [...new Set(urls.map((url) => new URL(url).origin))]
}

const CHARSET = /<meta charSet="utf-8"\/>|<meta charset="utf-8"\/?>/i

/** The page with its policy, placed after the charset (or first in <head>); a page that already has one is left. */
export function withPolicy(html: string): string {
  if (html.includes('http-equiv="Content-Security-Policy"')) return html
  const meta = `<meta http-equiv="Content-Security-Policy" content="${policyFor(html)}"/>`
  const charset = CHARSET.exec(html)
  if (charset !== null) return html.replace(charset[0], `${charset[0]}${meta}`)
  return html.replace(/<head([^>]*)>/i, `<head$1>${meta}`)
}
