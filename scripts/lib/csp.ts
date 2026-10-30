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

export function policyFor(html: string): string {
  const hashes = [...new Set(inlineScripts(html).map(sha256))]
  return [`script-src 'self' ${hashes.join(' ')}`.trim(), "object-src 'none'", "base-uri 'self'"].join('; ')
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
