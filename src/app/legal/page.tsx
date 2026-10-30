import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHead } from '@/components/content/PageHead'
import { getMessages } from '@/i18n'
import { baseSlug } from '@/lib/content'
import { legalPages } from '@/lib/collections'

const { legal } = getMessages()

export const metadata: Metadata = {
  title: legal.metaTitle,
  description: legal.metaDescription,
  alternates: { canonical: '/legal/' },
}

export default function LegalIndex(): React.JSX.Element {
  return (
    <>
      <PageHead eyebrow={legal.eyebrow} title={legal.title} lead={legal.lead} />
      <section className="section section--tight">
        <ul className="container link-list">
          {legalPages().map((page) => (
            <li key={page.slug}>
              <Link href={`/legal/${baseSlug(page.slug)}/`}>{page.meta.title}</Link>
              <p className="muted small">{page.meta.description}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
