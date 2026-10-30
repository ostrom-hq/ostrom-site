// SPDX-License-Identifier: Apache-2.0
import { en } from '@/i18n/en'

// The characters kept in archivo-latin.woff2 by scripts/fonts/subset-archivo.py: a text outside them would fall back
// to a system font. Keep both lists in step.
const IN_FONT =
  /^[\n\u0020-\u007E\u00A0\u00A9\u00AB\u00B7\u00BB\u00C0\u00C9\u00D7\u00E0\u00E2\u00E7\u00E8-\u00EB\u00EE\u00EF\u00F4\u00F9\u00FB\u00FC\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026\u20AC\u2122\u2191\u2193\u2212]*$/u

function texts(node: unknown): string[] {
  if (typeof node === 'string') return [node]
  if (typeof node === 'object' && node !== null) return Object.values(node).flatMap(texts)
  return []
}

describe('fonts', () => {
  it('cover every character of the site texts', () => {
    const outside = [...new Set(texts(en).join('\n'))].filter((character) => !IN_FONT.test(character))
    expect(outside).toEqual([])
    expect(texts(1)).toEqual([])
  })
})
