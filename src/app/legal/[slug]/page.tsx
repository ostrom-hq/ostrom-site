// SPDX-License-Identifier: Apache-2.0
import type { Metadata } from 'next'
import { Article } from '@/components/content/Article'
import { PageHead } from '@/components/content/PageHead'
import { getMessages } from '@/i18n'
import { baseSlug } from '@/lib/content'
import { formatDate, legalPages } from '@/lib/collections'

interface LegalPageProps {
  readonly params: Promise<{ readonly slug: string }>
}

export const dynamicParams = false

export function generateStaticParams(): { slug: string }[] {
  return legalPages().map((page) => ({ slug: baseSlug(page.slug) }))
}

function find(slug: string): ReturnType<typeof legalPages>[number] {
  const page = legalPages().find((candidate) => baseSlug(candidate.slug) === slug)
  if (page === undefined) throw new Error(`No legal page "${slug}"`)
  return page
}

export async function generateMetadata({ params }: LegalPageProps): Promise<Metadata> {
  const { slug } = await params
  const page = find(slug)
  return {
    title: page.meta.title,
    description: page.meta.description,
    alternates: { canonical: `/legal/${slug}/` },
    // A draft is reachable for review, never indexed.
    ...(page.meta.draft ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function LegalPage({ params }: LegalPageProps): Promise<React.JSX.Element> {
  const { slug } = await params
  const page = find(slug)
  const { legal, pages } = getMessages()
  return (
    <>
      <PageHead eyebrow={legal.eyebrow} title={page.meta.title} lead={page.meta.description} />
      <Article
        blocks={page.blocks}
        draft={page.meta.draft}
        updated={formatDate(page.meta.updated)}
        labels={pages}
      />
    </>
  )
}
