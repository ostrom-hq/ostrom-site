import { getMessages } from '@/i18n'
import { baseSlug } from '@/lib/content'
import { publishedPosts } from '@/lib/collections'
import { absoluteUrl } from '@/lib/site'

export const dynamic = 'force-static'

const escape = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** RSS 2.0 feed of the published posts. */
export function GET(): Response {
  const { blog, meta } = getMessages()
  const items = publishedPosts()
    .map((post) => {
      const url = absoluteUrl(`/blog/${baseSlug(post.slug)}/`)
      return `<item><title>${escape(post.meta.title)}</title><link>${url}</link><guid>${url}</guid><pubDate>${new Date(`${post.meta.date}T00:00:00Z`).toUTCString()}</pubDate><description>${escape(post.meta.description)}</description></item>`
    })
    .join('')
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escape(`${meta.siteName} ${blog.metaTitle}`)}</title><link>${absoluteUrl('/blog/')}</link><description>${escape(blog.metaDescription)}</description><language>en</language>${items}</channel></rss>`
  return new Response(xml, { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } })
}
