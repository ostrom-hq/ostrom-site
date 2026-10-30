// SPDX-License-Identifier: Apache-2.0
import type { Metadata } from 'next'
import { PageHead } from '@/components/content/PageHead'
import { RepoName } from '@/components/content/RepoName'
import { getMessages } from '@/i18n'
import { site } from '@/lib/site'

const { openSource } = getMessages()

export const metadata: Metadata = {
  title: openSource.metaTitle,
  description: openSource.metaDescription,
  alternates: { canonical: '/open-source/' },
}

export default function OpenSourcePage(): React.JSX.Element {
  const [before, after] = openSource.contribute.split('{email}')
  return (
    <>
      <PageHead eyebrow={openSource.eyebrow} title={openSource.title} lead={openSource.lead} />
      <section className="section" aria-labelledby="repositories">
        <div className="container">
          <h2 id="repositories">{openSource.reposTitle}</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">{openSource.repository}</th>
                  <th scope="col">{openSource.what}</th>
                  <th scope="col">{openSource.license}</th>
                </tr>
              </thead>
              <tbody>
                {openSource.repos.map((repo) => (
                  <tr key={repo.name}>
                    <th scope="row">
                      <RepoName name={repo.name} config={site} />
                    </th>
                    <td>{repo.what}</td>
                    <td>{repo.license}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <section className="section section--subtle" aria-labelledby="licenses">
        <div className="container">
          <h2 id="licenses">{openSource.modelTitle}</h2>
          <div className="grid grid--3">
            {openSource.model.map((item) => (
              <article key={item.title} className="card">
                <h3>{item.title}</h3>
                <p className="muted">{item.body}</p>
              </article>
            ))}
          </div>
          <p className="section--tight">
            {before}
            <a href={`mailto:${site.securityEmail}`}>{site.securityEmail}</a>
            {after}
          </p>
        </div>
      </section>
    </>
  )
}
