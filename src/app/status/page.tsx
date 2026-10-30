// SPDX-License-Identifier: Apache-2.0
import type { Metadata } from 'next'
import { PageHead } from '@/components/content/PageHead'
import { StatusBoard } from '@/components/status/StatusBoard'
import { getMessages } from '@/i18n'
import { site } from '@/lib/site'

const { status } = getMessages()

export const metadata: Metadata = {
  title: status.metaTitle,
  description: status.metaDescription,
  alternates: { canonical: '/status/' },
}

export default function StatusPage(): React.JSX.Element {
  const [before, after] = status.help.split('{email}')
  return (
    <>
      <PageHead eyebrow={status.eyebrow} title={status.title} lead={status.lead} />
      <section className="section section--tight">
        <div className="container measure">
          <StatusBoard
            labels={status}
            config={{ siteUrl: site.siteUrl, appUrl: site.appUrl, apiUrl: site.apiUrl }}
          />
          <p className="small">
            {before}
            <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
            {after}
          </p>
        </div>
      </section>
    </>
  )
}
