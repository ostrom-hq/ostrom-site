// SPDX-License-Identifier: Apache-2.0
import { answer, contentType } from './static'

describe('static server', () => {
  const files = new Set(['index.html', 'pricing/index.html', '404.html'])

  it('serves pages and falls back to the 404 page', () => {
    expect(answer('/', files)).toEqual({ status: 200, file: 'index.html' })
    expect(answer('/pricing', files)).toEqual({ status: 200, file: 'pricing/index.html' })
    expect(answer('/missing/', files)).toEqual({ status: 404, file: '404.html' })
    expect(answer('/../etc/passwd', files)).toEqual({ status: 404, file: '404.html' })
    // An invalid percent-encoding is a 404, not a crash of the server.
    expect(answer('/%E0%A4%A', files)).toEqual({ status: 404, file: '404.html' })
    expect(answer('/missing/', new Set())).toEqual({ status: 404, file: null })
    expect(answer('/../x', new Set())).toEqual({ status: 404, file: null })
  })

  it('knows the content types the export uses', () => {
    expect(contentType('a/index.html')).toBe('text/html; charset=utf-8')
    expect(contentType('font.WOFF2')).toBe('font/woff2')
    expect(contentType('blob.bin')).toBe('application/octet-stream')
  })
})
