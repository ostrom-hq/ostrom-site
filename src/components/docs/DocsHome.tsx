// SPDX-License-Identifier: Apache-2.0
import Link from 'next/link'
import type { Messages } from '@/i18n'
import { DocArticle } from './DocArticle'

/** The docs home while a version has no index page yet (the guides are not merged): says so, points at the API reference. */
export function DocsHome({ messages }: { readonly messages: Messages }): React.JSX.Element {
  const text = messages.docs
  return (
    <DocArticle
      title={text.home.title}
      description={text.description}
      status="coming-soon"
      labels={text.status}
    >
      <div className="docs-prose">
        <p>{text.home.lead}</p>
        <p>
          <Link className="button" href="/docs/api/" prefetch={false}>
            {text.home.api}
          </Link>
        </p>
      </div>
    </DocArticle>
  )
}
