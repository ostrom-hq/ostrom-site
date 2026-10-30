// SPDX-License-Identifier: Apache-2.0
import type { Metadata } from 'next'
import { PageHead } from '@/components/content/PageHead'
import { getMessages } from '@/i18n'

const { compare } = getMessages()

export const metadata: Metadata = {
  title: compare.metaTitle,
  description: compare.metaDescription,
  alternates: { canonical: '/compare/' },
}

export default function ComparePage(): React.JSX.Element {
  return (
    <>
      <PageHead eyebrow={compare.eyebrow} title={compare.title} lead={compare.lead} />
      <section className="section section--tight">
        <div className="container stack">
          {compare.items.map((item) => (
            <article key={item.name} className="card compare-item">
              <header>
                <h2>{item.name}</h2>
                <p className="small muted">{item.examples}</p>
              </header>
              <dl className="grid grid--3">
                <div>
                  <dt>{compare.them}</dt>
                  <dd>{item.them}</dd>
                </div>
                <div>
                  <dt>{compare.us}</dt>
                  <dd>{item.us}</dd>
                </div>
                <div>
                  <dt>{compare.choose}</dt>
                  <dd>{item.choose}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
