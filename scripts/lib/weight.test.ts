// SPDX-License-Identifier: Apache-2.0
import { elementCount, pageWeights } from './weight'

describe('elementCount', () => {
  it('counts the opening tags of the markup, not the text of scripts and styles', () => {
    expect(elementCount('<!DOCTYPE html><html><body><p>a <b>b</b></p><br/></body></html>')).toBe(5)
    expect(
      elementCount('<script>var a = "<div><span>"</script><style>p::before{content:"<i>"}</style><p>x</p>'),
    ).toBe(3)
    expect(elementCount('no markup')).toBe(0)
  })
})

describe('pageWeights', () => {
  it('lists the pages by weight, the heaviest first', () => {
    const pages = new Map([
      ['a.html', '<p></p>'],
      ['b.html', '<p><i></i></p>'],
      ['c.html', '<p></p>'],
    ])
    expect(pageWeights(pages)).toEqual([
      { page: 'b.html', elements: 2 },
      { page: 'a.html', elements: 1 },
      { page: 'c.html', elements: 1 },
    ])
  })
})
