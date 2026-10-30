import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHead } from '@/components/content/PageHead'
import { format, getMessages } from '@/i18n'
import { baseSlug } from '@/lib/content'
import { formatDate, publishedPosts } from '@/lib/collections'

const { blog } = getMessages()

export const metadata: Metadata = {
  title: blog.metaTitle,
  description: blog.metaDescription,
  alternates: { canonical: '/blog/', types: { 'application/rss+xml': '/blog/rss.xml' } },
}

export default function BlogIndex(): React.JSX.Element {
  const posts = publishedPosts()
  return (
    <>
      <PageHead eyebrow={blog.eyebrow} title={blog.title} lead={blog.lead} />
      <section className="section section--tight">
        <div className="container">
          {posts.length === 0 ? (
            <p className="muted">{blog.empty}</p>
          ) : (
            <ul className="post-list">
              {posts.map((post) => (
                <li key={post.slug}>
                  <p className="small muted mono">
                    <time dateTime={post.meta.date}>{formatDate(post.meta.date)}</time>
                  </p>
                  <h2>
                    <Link href={`/blog/${baseSlug(post.slug)}/`}>{post.meta.title}</Link>
                  </h2>
                  <p className="muted">{post.meta.description}</p>
                  <p className="small">{format(blog.by, { author: post.meta.author })}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  )
}
