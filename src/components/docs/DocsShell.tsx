// SPDX-License-Identifier: Apache-2.0
import Link from 'next/link'
import type { Messages } from '@/i18n'
import type { TocItem } from '@/lib/docs/markdown'
import { breadcrumbs, pager, sidebar } from '@/lib/docs/navigation'
import type { DocsSite, DocsVersion } from '@/lib/docs/site'
import { fill } from '@/lib/docs/text'
import { Breadcrumbs } from './Breadcrumbs'
import { CopyListener } from './CopyListener'
import { Pager } from './Pager'
import { SearchButton } from './SearchButton'
import { SidebarFrame } from './SidebarFrame'
import { SidebarTree } from './Sidebar'
import { TableOfContents } from './TableOfContents'
import { VersionSelect } from './VersionSelect'

interface DocsShellProps {
  readonly messages: Messages
  readonly docs: DocsSite
  readonly version: DocsVersion
  /** The URL of the page, which the sidebar, the breadcrumbs and previous/next are matched against. */
  readonly href: string
  readonly toc: readonly TocItem[]
  readonly children: React.ReactNode
}

/**
 * The frame of every docs page (Stripe, Vercel, Supabase): a docs bar (search, version), the sidebar, the page with
 * its breadcrumbs and previous/next, and "On this page". Everything is rendered at build time; the only scripts are
 * the search button, the phone menu, the copy buttons and the reading marker of the table of contents.
 */
export function DocsShell({
  messages,
  docs,
  version,
  href,
  toc,
  children,
}: DocsShellProps): React.JSX.Element {
  const text = messages.docs
  const entries = sidebar(version, docs.api, {
    apiReference: text.api.title,
    apiOverview: text.api.overview,
    schemas: text.api.schemas,
  })
  const home = `${version.basePath}/`
  return (
    <div className="docs">
      <div className="docs-bar">
        <div className="container docs-bar__inner">
          <Link className="docs-bar__title" href={home} prefetch={false}>
            {text.title}
          </Link>
          <SearchButton labels={text.search} version={version.id} />
          <VersionSelect versions={docs.versions} current={version} labels={text.versions} />
        </div>
      </div>
      <div className="container docs-layout">
        <SidebarFrame label={text.nav.label} menuLabel={text.nav.menu}>
          <SidebarTree entries={entries} href={href} labels={text.status} depth={0} />
        </SidebarFrame>
        <div className="docs-main">
          {version.latest ? null : (
            <p className="notice docs-archived">
              {fill(text.versions.archived, { label: version.label })}{' '}
              <Link href="/docs/" prefetch={false}>{text.versions.latest}</Link>
            </p>
          )}
          <Breadcrumbs
            crumbs={breadcrumbs({ title: text.title, href: home }, entries, href)}
            label={text.nav.breadcrumb}
          />
          {children}
          <Pager pager={pager(entries, href)} labels={text.nav} />
        </div>
        <TableOfContents items={toc} label={text.nav.toc} />
      </div>
      <CopyListener labels={text.code} />
    </div>
  )
}
