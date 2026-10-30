// SPDX-License-Identifier: Apache-2.0
import { createHash } from 'node:crypto'
import { inlineScripts, policyFor, sha256, withPolicy } from './csp'

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

  it('allows the site itself and each inline script once', () => {
    expect(policyFor(page)).toBe(
      `script-src 'self' ${sha256(theme)} ${sha256('self.__next_f.push([1,"a"])')}; object-src 'none'; base-uri 'self'`,
    )
    expect(policyFor('<html><head></head></html>')).toBe(
      "script-src 'self'; object-src 'none'; base-uri 'self'",
    )
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
})
