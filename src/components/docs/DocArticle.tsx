import type { Messages } from '@/i18n'
import type { PageStatus } from '@/lib/docs/content'
import { StatusBadge } from './StatusBadge'

interface DocArticleProps {
  readonly title: string
  readonly description: string
  readonly status: PageStatus
  readonly labels: Messages['docs']['status']
  readonly children: React.ReactNode
}

/** A page's title block (title, status, description) and its body. */
export function DocArticle({
  title,
  description,
  status,
  labels,
  children,
}: DocArticleProps): React.JSX.Element {
  return (
    <article className="docs-article">
      <header className="docs-article__head">
        <div className="docs-article__title">
          <h1>{title}</h1>
          <StatusBadge status={status} labels={labels} />
        </div>
        <p className="lead">{description}</p>
      </header>
      {children}
    </article>
  )
}

/** Markdown rendered at build time (markdown.ts drops raw HTML from the source, so it is safe to inline). */
export function Prose({ html }: { readonly html: string }): React.JSX.Element {
  return <div className="docs-prose" dangerouslySetInnerHTML={{ __html: html }} />
}
