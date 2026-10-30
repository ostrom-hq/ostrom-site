// SPDX-License-Identifier: Apache-2.0
import { z } from './zod'
import { baseSlug, loadFolder, type Document } from './content'

const isoDate = z.iso.date()

export const legalSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  updated: z.union([isoDate, z.date().transform((date) => date.toISOString().slice(0, 10))]),
  draft: z.boolean(),
})
export type LegalMeta = z.infer<typeof legalSchema>

export const postSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.union([isoDate, z.date().transform((date) => date.toISOString().slice(0, 10))]),
  author: z.string().min(1),
  draft: z.boolean(),
})
export type PostMeta = z.infer<typeof postSchema>

/** Legal pages in reading order: the notice first, then the contracts. */
const LEGAL_ORDER = ['imprint', 'terms', 'privacy', 'dpa', 'cookies']

export function legalPages(root?: string): Document<LegalMeta>[] {
  return loadFolder('legal', legalSchema, root).sort(
    (a, b) => LEGAL_ORDER.indexOf(baseSlug(a.slug)) - LEGAL_ORDER.indexOf(baseSlug(b.slug)),
  )
}

/** Every post, newest first. Drafts are built (for review by direct link) but never listed. */
export function allPosts(root?: string): Document<PostMeta>[] {
  return loadFolder('blog', postSchema, root).sort((a, b) => b.meta.date.localeCompare(a.meta.date))
}

export function publishedPosts(root?: string): Document<PostMeta>[] {
  return allPosts(root).filter((post) => !post.meta.draft)
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}
