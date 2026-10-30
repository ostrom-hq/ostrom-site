// SPDX-License-Identifier: Apache-2.0
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'
import { z } from './zod'
import { group, parseMarkdown, type Block } from './markdown'

/** Root of the Markdown content, next to the app. */
export const CONTENT_ROOT = join(process.cwd(), 'content')

const FRONTMATTER = /^---\n([\s\S]*?)\n---\n?/

export interface Document<Meta> {
  readonly slug: string
  readonly meta: Meta
  readonly blocks: readonly Block[]
}

/** Splits the YAML frontmatter from the body and validates it; a malformed file fails the build. */
export function parseDocument<Meta>(slug: string, source: string, schema: z.ZodType<Meta>): Document<Meta> {
  const normalized = source.replace(/\r\n?/g, '\n')
  const match = FRONTMATTER.exec(normalized)
  const data: unknown = match === null ? {} : parse(group(match, 1))
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new Error(`content/${slug}: invalid frontmatter: ${z.prettifyError(result.error)}`)
  }
  const body = match === null ? normalized : normalized.slice(match[0].length)
  return { slug, meta: result.data, blocks: parseMarkdown(body) }
}

/** Every `.md` file of a content folder, parsed, in file-name order. */
export function loadFolder<Meta>(
  folder: string,
  schema: z.ZodType<Meta>,
  root: string = CONTENT_ROOT,
): Document<Meta>[] {
  return readdirSync(join(root, folder))
    .filter((name) => name.endsWith('.md'))
    .sort()
    .map((name) =>
      parseDocument(`${folder}/${name.slice(0, -3)}`, readFileSync(join(root, folder, name), 'utf8'), schema),
    )
}

/** The part of a slug after its folder: `legal/terms` → `terms`. */
export function baseSlug(slug: string): string {
  return slug.slice(slug.lastIndexOf('/') + 1)
}
