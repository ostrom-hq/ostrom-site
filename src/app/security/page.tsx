// SPDX-License-Identifier: Apache-2.0
import type { Metadata } from 'next'
import { PageHead } from '@/components/content/PageHead'
import { getMessages } from '@/i18n'
import { site } from '@/lib/site'

const { security } = getMessages()

export const metadata: Metadata = {
  title: security.metaTitle,
  description: security.metaDescription,
  alternates: { canonical: '/security/' },
}

export default function SecurityPage(): React.JSX.Element {
  const [before, after] = security.disclosureBody.split('{email}')
  return (
    <>
      <PageHead eyebrow={security.eyebrow} title={security.title} lead={security.lead} />
      <section className="section" aria-labelledby="threats">
        <div className="container">
          <h2 id="threats">{security.threatTitle}</h2>
          <p className="lead">{security.threatLead}</p>
          <dl className="threats grid grid--2">
            {security.threats.map((item) => (
              <div key={item.threat} className="card">
                <dt>{item.threat}</dt>
                <dd className="muted">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
      <section className="section section--subtle" aria-labelledby="receipts">
        <div className="container grid grid--2">
          <div>
            <h2 id="receipts">{security.receiptsTitle}</h2>
            <p className="lead">{security.receiptsBody}</p>
          </div>
          <div>
            <h2 id="platform">{security.platformTitle}</h2>
            <ul className="checklist">
              {security.platform.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <section className="section" aria-labelledby="disclosure">
        <div className="container measure">
          <h2 id="disclosure">{security.disclosureTitle}</h2>
          <p className="lead">
            {before}
            <a href={`mailto:${site.securityEmail}`}>{site.securityEmail}</a>
            {after}
          </p>
          <ul className="checklist">
            {security.disclosureRules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
          <p>{security.safeHarbor}</p>
          <p className="small muted">
            <a href="/.well-known/security.txt">security.txt</a>
          </p>
        </div>
      </section>
    </>
  )
}
