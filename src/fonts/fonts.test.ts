import { en } from '@/i18n/en'

// The characters kept in archivo-latin.woff2 by scripts/fonts/subset-archivo.py: a text outside them would fall back
// to a system font. Keep both lists in step.
const IN_FONT = /^[\n -~ ©«·»ÀÉ×àâçè-ëîïôùûü–—‘’“”•…€™←→−]*$/u

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
