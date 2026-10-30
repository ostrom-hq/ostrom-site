import { at, group, outline, parseInline, parseMarkdown, plainText, slugify } from './markdown'

describe('helpers', () => {
  it('reads past the end as an empty string', () => {
    expect(at(['a'], 0)).toBe('a')
    expect(at(['a'], 3)).toBe('')
    const match = /(a)|(b)/.exec('b')
    expect(match).not.toBeNull()
    if (match !== null) {
      expect(group(match, 1)).toBe('')
      expect(group(match, 2)).toBe('b')
    }
  })

  it('slugifies like GitHub', () => {
    expect(slugify('1. The service')).toBe('1-the-service')
    expect(slugify('Données & vie privée')).toBe('donnees-vie-privee')
  })
})

describe('parseInline', () => {
  it('reads code, bold, emphasis and safe links', () => {
    expect(parseInline('a `b` **c** *d* [e](https://x.y) [f](/g) [m](mailto:a@b)')).toEqual([
      { kind: 'text', text: 'a ' },
      { kind: 'code', text: 'b' },
      { kind: 'text', text: ' ' },
      { kind: 'strong', children: [{ kind: 'text', text: 'c' }] },
      { kind: 'text', text: ' ' },
      { kind: 'em', children: [{ kind: 'text', text: 'd' }] },
      { kind: 'text', text: ' ' },
      { kind: 'link', href: 'https://x.y', children: [{ kind: 'text', text: 'e' }] },
      { kind: 'text', text: ' ' },
      { kind: 'link', href: '/g', children: [{ kind: 'text', text: 'f' }] },
      { kind: 'text', text: ' ' },
      { kind: 'link', href: 'mailto:a@b', children: [{ kind: 'text', text: 'm' }] },
    ])
  })

  it('keeps an unsafe link as text', () => {
    expect(parseInline('[x](javascript:alert(1))')).toEqual([
      { kind: 'text', text: '[x](javascript:alert(1)' },
      { kind: 'text', text: ')' },
    ])
    expect(parseInline('')).toEqual([])
  })
})

describe('parseMarkdown', () => {
  it('reads every block kind and ignores the level-1 title', () => {
    const blocks = parseMarkdown(
      [
        '# Title',
        '',
        '## One',
        'A paragraph',
        'on two lines.',
        '',
        '### Sub',
        '#### Deep',
        '- a',
        '- b',
        '  continued',
        '',
        '1. first',
        '2) second',
        '',
        '> quoted',
        '> more',
        '',
        '---',
        '```ts test',
        'const x = 1',
        '```',
        '```',
        'plain',
        '```',
        '## One',
        '## !!!',
      ].join('\r\n'),
    )
    expect(blocks.map((block) => block.kind)).toEqual([
      'heading',
      'paragraph',
      'heading',
      'heading',
      'list',
      'list',
      'quote',
      'rule',
      'code',
      'code',
      'heading',
      'heading',
    ])
    expect(blocks[0]).toEqual({
      kind: 'heading',
      level: 2,
      id: 'one',
      children: [{ kind: 'text', text: 'One' }],
    })
    expect(blocks[1]).toEqual({
      kind: 'paragraph',
      children: [{ kind: 'text', text: 'A paragraph on two lines.' }],
    })
    expect(blocks[2]).toMatchObject({ level: 3, id: 'sub' })
    expect(blocks[3]).toMatchObject({ level: 4, id: 'deep' })
    expect(blocks[4]).toEqual({
      kind: 'list',
      ordered: false,
      items: [
        [{ kind: 'text', text: 'a' }],
        [
          { kind: 'text', text: 'b' },
          { kind: 'text', text: ' ' },
          { kind: 'text', text: 'continued' },
        ],
      ],
    })
    expect(blocks[5]).toMatchObject({ ordered: true })
    expect(blocks[6]).toEqual({ kind: 'quote', children: [{ kind: 'text', text: 'quoted more' }] })
    expect(blocks[8]).toEqual({ kind: 'code', language: 'ts', text: 'const x = 1' })
    expect(blocks[9]).toEqual({ kind: 'code', language: '', text: 'plain' })
    expect(blocks[10]).toMatchObject({ id: 'one-1' })
    expect(blocks[11]).toMatchObject({ id: 'section' })
  })

  it('ends a paragraph at the next block', () => {
    const kinds = (source: string): string[] => parseMarkdown(source).map((block) => block.kind)
    expect(kinds('text\n## h')).toEqual(['paragraph', 'heading'])
    expect(kinds('text\n```\ncode\n```')).toEqual(['paragraph', 'code'])
    expect(kinds('text\n> q')).toEqual(['paragraph', 'quote'])
    expect(kinds('text\n- item')).toEqual(['paragraph', 'list'])
    expect(kinds('text\n1. item')).toEqual(['paragraph', 'list'])
    expect(kinds('- item\nafter')).toEqual(['list', 'paragraph'])
    expect(kinds('***')).toEqual(['rule'])
    expect(parseMarkdown('```sh\nunterminated')).toEqual([
      { kind: 'code', language: 'sh', text: 'unterminated' },
    ])
  })

  it('builds an outline of h2 and h3', () => {
    const blocks = parseMarkdown('## A `b` **c**\n### D [e](/f)\n#### G')
    expect(outline(blocks)).toEqual([
      { id: 'a-b-c', level: 2, text: 'A b c' },
      { id: 'd-e', level: 3, text: 'D e' },
    ])
    expect(plainText([{ kind: 'em', children: [{ kind: 'text', text: 'x' }] }])).toBe('x')
  })
})
