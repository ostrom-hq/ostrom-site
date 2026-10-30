// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { FIXTURE_CONTENT, MISSING_CONTENT } from '@/test/docs'
import { readContent, readFolder, readPage, titleFromName, type DocNode } from './content'

const page = (title: string, extra = ''): string =>
  `---\ntitle: ${title}\ndescription: "About ${title}."\n${extra}---\n\nBody.\n`

function folderOf(files: Readonly<Record<string, string>>): string {
  const dir = mkdtempSync(join(tmpdir(), 'ostrom-docs-'))
  for (const [name, text] of Object.entries(files)) {
    mkdirSync(join(dir, name, '..'), { recursive: true })
    writeFileSync(join(dir, name), text)
  }
  return dir
}

const slugs = (nodes: readonly DocNode[]): string[] => nodes.map((node) => node.slug.join('/'))

describe('readFolder', () => {
  const root = readFolder(join(FIXTURE_CONTENT, 'docs'))

  it('reads the index and orders pages by meta.json, then the others alphabetically', () => {
    expect(root.title).toBe('Docs')
    expect(root.index?.frontmatter).toEqual({
      title: 'Introduction',
      description: 'What the fixture is.',
      status: 'partial',
    })
    expect(root.index?.slug).toEqual([])
    expect(slugs(root.children)).toEqual(['quickstart', 'guides', 'alpha', 'zeta'])
  })

  it('reads nested folders, titled by meta.json or by their name', () => {
    const guides = root.children[1]
    if (guides?.kind !== 'folder') throw new Error('guides should be a folder')
    expect(guides.title).toBe('Guides')
    expect(guides.index?.frontmatter.title).toBe('Guides')
    expect(slugs(guides.children)).toEqual(['guides/deep', 'guides/advanced'])
    const advanced = guides.children[1]
    if (advanced?.kind !== 'folder') throw new Error('advanced should be a folder')
    expect(advanced.index).toBeNull()
    expect(advanced.title).toBe('Advanced')
    expect(slugs(advanced.children)).toEqual(['guides/advanced/page'])
  })

  it('defaults the status to available and reads .md pages too', () => {
    const [, , alpha, zeta] = root.children
    expect(alpha?.kind === 'page' && alpha.frontmatter.status).toBe('available')
    expect(zeta?.kind === 'page' && zeta.body.trim()).toBe('Last.')
  })

  it('names a root folder without meta.json "Docs"', () => {
    expect(readFolder(join(FIXTURE_CONTENT, 'docs-versions', 'v0.1')).title).toBe('Docs')
  })

  it('fails on a page listed in meta.json that does not exist', () => {
    const dir = folderOf({ 'meta.json': '{"pages": ["index", "ghost"]}', 'index.mdx': page('Home') })
    expect(() => readFolder(dir)).toThrow('"ghost" is listed')
  })

  it('fails on a malformed meta.json', () => {
    const dir = folderOf({ 'meta.json': '{"pages": "index"}' })
    expect(() => readFolder(dir)).toThrow('invalid meta.json')
  })

  it('fails on a page without frontmatter or with a bad one', () => {
    expect(() => readPage('# No frontmatter', 'a.mdx', [])).toThrow('a.mdx: the page has no frontmatter')
    expect(() => readPage(page('Bad', 'status: draft\n'), 'b.mdx', [])).toThrow('b.mdx: invalid frontmatter')
  })

  it('refuses a top-level page that would shadow a generated route, but not a nested one', () => {
    expect(() => readFolder(folderOf({ 'api.mdx': page('API') }))).toThrow('"api" is reserved')
    expect(slugs(readFolder(folderOf({ 'guides/api.mdx': page('API') })).children)).toEqual(['guides'])
  })
})

describe('readContent', () => {
  it('is null when the folder does not exist yet', () => {
    expect(readContent(MISSING_CONTENT)).toBeNull()
  })
})

describe('titleFromName', () => {
  it('turns a file name into a title', () => {
    expect(titleFromName('mcp-and-secrets')).toBe('Mcp and secrets')
  })
})
