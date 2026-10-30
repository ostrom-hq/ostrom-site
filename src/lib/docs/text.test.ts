// SPDX-License-Identifier: Apache-2.0
import { captured, collapseWhitespace, fill, truncate } from './text'

describe('text helpers', () => {
  it('reads a capture group, and an empty text for a group that took no part', () => {
    const match = /a(b)?(c)/.exec('ac')
    if (match === null) throw new Error('the pattern should match')
    expect(captured(match, 1)).toBe('')
    expect(captured(match, 2)).toBe('c')
  })

  it('collapses whitespace into single spaces', () => {
    expect(collapseWhitespace('  a \n\n b\t c ')).toBe('a b c')
  })

  it('cuts a long text with an ellipsis and leaves a short one alone', () => {
    expect(truncate('abcdef', 4)).toBe('abc…')
    expect(truncate('abc', 4)).toBe('abc')
  })

  it('fills placeholders and leaves an unknown one visible', () => {
    expect(fill('{a} and {b}', { a: 'one' })).toBe('one and {b}')
  })
})
