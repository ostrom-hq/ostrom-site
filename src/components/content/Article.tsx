// SPDX-License-Identifier: Apache-2.0
import { format, type Messages } from '@/i18n'
import { outline, type Block } from '@/lib/markdown'
import { Markdown } from './Markdown'

interface ArticleProps {
  readonly blocks: readonly Block[]
  readonly draft: boolean
  readonly updated?: string
  readonly labels: Messages['pages']
}

/** A long text with its table of contents, and the draft banner while it is not validated. */
export function Article({ blocks, draft, updated, labels }: ArticleProps): React.JSX.Element {
  const toc = outline(blocks)
  return (
    <div className="container article">
      <div className="article__body">
        {draft ? (
          <p className="notice" role="note">
            {labels.draftBanner}
          </p>
        ) : null}
        {updated === undefined ? null : (
          <p className="small muted">{format(labels.updated, { date: updated })}</p>
        )}
        <Markdown blocks={blocks} />
      </div>
      {toc.length === 0 ? null : (
        <nav className="article__toc" aria-label={labels.onThisPage}>
          <p className="article__toc-title">{labels.onThisPage}</p>
          <ul>
            {toc.map((entry) => (
              <li key={entry.id} className={entry.level === 3 ? 'article__toc-sub' : undefined}>
                <a href={`#${entry.id}`}>{entry.text}</a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  )
}
