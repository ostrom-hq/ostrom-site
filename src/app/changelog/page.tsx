import type { Metadata } from 'next'
import { Markdown } from '@/components/content/Markdown'
import { PageHead } from '@/components/content/PageHead'
import { getMessages } from '@/i18n'
import { byMonth, loadReleases, productName } from '@/lib/changelog'
import { formatDate } from '@/lib/collections'
import { parseMarkdown } from '@/lib/markdown'

const { changelog } = getMessages()

export const metadata: Metadata = {
  title: changelog.metaTitle,
  description: changelog.metaDescription,
  alternates: { canonical: '/changelog/' },
}

export default function ChangelogPage(): React.JSX.Element {
  const months = byMonth(loadReleases())
  return (
    <>
      <PageHead eyebrow={changelog.eyebrow} title={changelog.title} lead={changelog.lead} />
      <section className="section section--tight">
        <div className="container changelog">
          {months.length === 0 ? <p className="muted">{changelog.empty}</p> : null}
          {months.map((group) => (
            <section key={group.month} aria-labelledby={`month-${group.month.replace(/\s/g, '-')}`}>
              <h2 id={`month-${group.month.replace(/\s/g, '-')}`} className="changelog__month">
                {group.month}
              </h2>
              {group.releases.map((release) => (
                <article key={`${release.repository}-${release.tag}`} className="changelog__release">
                  <header className="changelog__meta">
                    <span className="badge">{productName(release.repository)}</span>
                    <h3>{release.name}</h3>
                    <p className="small muted mono">
                      <time dateTime={release.publishedAt}>
                        {formatDate(release.publishedAt.slice(0, 10))}
                      </time>
                      {' · '}
                      {release.tag}
                    </p>
                  </header>
                  <Markdown blocks={parseMarkdown(release.body)} />
                  <a href={release.url} rel="noopener" className="small">
                    {changelog.view}
                  </a>
                </article>
              ))}
            </section>
          ))}
        </div>
      </section>
    </>
  )
}
