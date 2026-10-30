// SPDX-License-Identifier: Apache-2.0
import type { Metadata } from 'next'
import Link from 'next/link'
import { Article } from '@/components/content/Article'
import { PageHead } from '@/components/content/PageHead'
import { format, getMessages } from '@/i18n'
import { baseSlug } from '@/lib/content'
import { allPosts, formatDate } from '@/lib/collections'
import { site } from '@/lib/site'

interface PostPageProps {
  readonly params: Promise<{ readonly slug: string }>
}

export const dynamicParams = false

/** Drafts are built too, reachable by direct link for review, but never listed nor indexed. */
export function generateStaticParams(): { slug: string }[] {
  return allPosts().map((post) => ({ slug: baseSlug(post.slug) }))
}

function find(slug: string): ReturnType<typeof allPosts>[number] {
  const post = allPosts().find((candidate) => baseSlug(candidate.slug) === slug)
  if (post === undefined) throw new Error(`No post "${slug}"`)
  return post
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = find(slug)
  return {
    title: post.meta.title,
    description: post.meta.description,
    alternates: { canonical: `/blog/${slug}/` },
    openGraph: {
      type: 'article',
      title: post.meta.title,
      description: post.meta.description,
      publishedTime: post.meta.date,
      authors: [post.meta.author],
      url: `/blog/${slug}/`,
    },
    ...(post.meta.draft ? { robots: { index: false, follow: site.launched } } : {}),
  }
}

export default async function PostPage({ params }: PostPageProps): Promise<React.JSX.Element> {
  const { slug } = await params
  const post = find(slug)
  const { blog, pages } = getMessages()
  return (
    <>
      <PageHead eyebrow={blog.eyebrow} title={post.meta.title} lead={post.meta.description}>
        <p className="small muted">
          <time dateTime={post.meta.date}>{formatDate(post.meta.date)}</time> ·{' '}
          {format(blog.by, { author: post.meta.author })}
          {post.meta.draft ? <span className="badge badge--warning">{blog.draft}</span> : null}
        </p>
      </PageHead>
      <Article blocks={post.blocks} draft={post.meta.draft} labels={pages} />
      <div className="container section--tight">
        <Link href="/blog/">← {blog.back}</Link>
      </div>
    </>
  )
}
