import { join } from 'node:path'
import { z } from 'zod'
import { baseSlug, CONTENT_ROOT, loadFolder, parseDocument } from './content'

const FIXTURES = join(process.cwd(), 'src/test/fixtures/content')
const schema = z.object({ title: z.string() })

describe('content', () => {
  it('reads the frontmatter and the body', () => {
    const document = parseDocument('x/y', '---\ntitle: Hello\n---\n## A\n\nText.', schema)
    expect(document.meta).toEqual({ title: 'Hello' })
    expect(document.blocks.map((block) => block.kind)).toEqual(['heading', 'paragraph'])
  })

  it('treats a file without frontmatter as all body', () => {
    const optional = z.object({ title: z.string().optional() })
    expect(parseDocument('x', 'Just text', optional).blocks).toHaveLength(1)
  })

  it('fails the build on an invalid frontmatter, naming the file', () => {
    expect(() => parseDocument('legal/broken', '---\ntitle: 3\n---\n', schema)).toThrow(
      /content\/legal\/broken/,
    )
  })

  it('loads the Markdown files of a folder in name order', () => {
    const documents = loadFolder('legal', schema, FIXTURES)
    expect(documents.map((document) => document.slug)).toEqual(['legal/imprint', 'legal/terms'])
  })

  it('knows the real content root and the base of a slug', () => {
    expect(CONTENT_ROOT).toBe(join(process.cwd(), 'content'))
    expect(baseSlug('legal/terms')).toBe('terms')
    expect(baseSlug('terms')).toBe('terms')
  })
})
