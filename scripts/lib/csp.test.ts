// SPDX-License-Identifier: Apache-2.0
import { createHash } from 'node:crypto'
import { connectOrigins, inlineScripts, policyFor, sha256, withPolicy } from './csp'
import { deferRuntime, loader } from './defer'
import { readSiteConfig } from '../../src/lib/site'

const theme = "(function(){document.documentElement.dataset.theme='dark'})()"
const page = [
  '<!DOCTYPE html><html><head><meta charSet="utf-8"/>',
  '<script src="/_next/static/chunks/main.js" async=""></script>',
  `<script>${theme}</script>`,
  '</head><body>',
  '<script type="application/ld+json">{"@type":"Organization"}</script>',
  '<script>self.__next_f.push([1,"a"])</script>',
  `<script>${theme}</script>`,
  '</body></html>',
].join('')

describe('csp', () => {
  it('finds the inline scripts the browser runs, not external files or data blocks', () => {
    expect(inlineScripts(page)).toEqual([theme, 'self.__next_f.push([1,"a"])', theme])
  })

  it('hashes a script the way browsers do', () => {
    const expected = createHash('sha256').update('alert(1)').digest('base64')
    expect(sha256('alert(1)')).toBe(`'sha256-${expected}'`)
  })

  const rest =
    "style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https:; object-src 'none'; base-uri 'self'"

  it('allows the site itself and each inline script once', () => {
    expect(policyFor(page)).toBe(
      `default-src 'self'; script-src 'self' ${sha256(theme)} ${sha256('self.__next_f.push([1,"a"])')}; ${rest}`,
    )
    expect(policyFor('<html><head></head></html>')).toBe(`default-src 'self'; script-src 'self'; ${rest}`)
  })

  it('loads everything else from the site only, and connects nowhere but over https', () => {
    const directives = policyFor(page).split('; ')
    expect(directives[0]).toBe("default-src 'self'")
    // nginx narrows `https:` to the console, the API and the analytics host (docker/site-config.sh).
    expect(directives).toContain("connect-src 'self' https:")
    expect(directives.some((directive) => directive.includes('unsafe-eval'))).toBe(false)
    expect(directives.find((directive) => directive.startsWith('script-src'))).not.toContain('unsafe-inline')
  })

  it('names the origins the pages connect to: the console and the API the status page probes', () => {
    expect(connectOrigins({})).toEqual(['https://app.ostrom.run', 'https://api.ostrom.run'])
    expect(
      connectOrigins({
        NEXT_PUBLIC_APP_URL: 'https://console.example.test/app/',
        NEXT_PUBLIC_API_URL: 'http://localhost:8080',
      }),
    ).toEqual(['https://console.example.test', 'http://localhost:8080'])
    expect(
      connectOrigins({
        NEXT_PUBLIC_APP_URL: 'http://localhost:8080',
        NEXT_PUBLIC_API_URL: 'http://localhost:8080',
      }),
    ).toEqual(['http://localhost:8080'])
  })

  it('reads the same origins as the site, defaults included', () => {
    for (const environment of [
      {},
      { NEXT_PUBLIC_API_URL: 'https://api.example.test/' },
      { NEXT_PUBLIC_APP_URL: 'http://localhost:8080', NEXT_PUBLIC_API_URL: 'http://localhost:8081' },
    ]) {
      const site = readSiteConfig(environment)
      expect(connectOrigins(environment)).toEqual([
        ...new Set([new URL(site.appUrl).origin, new URL(site.apiUrl).origin]),
      ])
    }
  })

  it('puts the policy right after the charset, before any script', () => {
    const result = withPolicy(page)
    expect(result.indexOf('http-equiv="Content-Security-Policy"')).toBeGreaterThan(result.indexOf('charSet'))
    expect(result.indexOf('http-equiv="Content-Security-Policy"')).toBeLessThan(result.indexOf('<script'))
    expect(withPolicy(result)).toBe(result)
  })

  it('opens the head with the policy when there is no charset', () => {
    expect(withPolicy('<html><head lang="en"><title>x</title></head></html>')).toBe(
      `<html><head lang="en"><meta http-equiv="Content-Security-Policy" content="${policyFor('')}"/><title>x</title></head></html>`,
    )
  })

  it('allows the loader of the deferred runtime, which the build writes before the policy', () => {
    const page =
      '<html><head><meta charSet="utf-8"/></head><body><script src="/_next/static/chunks/a.js" async=""></script></body></html>'
    const html = withPolicy(deferRuntime(page))
    expect(html).toContain(sha256(loader(['/_next/static/chunks/a.js'])))
  })
})
