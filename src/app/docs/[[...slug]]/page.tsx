// SPDX-License-Identifier: Apache-2.0
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  ApiOverview,
  ApiSchemasIndex,
  ApiSchemasPage,
  ApiTagPage,
  overviewToc,
  tagDescription,
} from '@/components/docs/api/ApiPages'
import { splitSummary } from '@/components/docs/api/InlineText'
import { DocArticle, Prose } from '@/components/docs/DocArticle'
import { DocsHome } from '@/components/docs/DocsHome'
import { DocsShell } from '@/components/docs/DocsShell'
import { getMessages, type Messages } from '@/i18n'
import type { TocItem } from '@/lib/docs/markdown'
import { markdownLabels, renderPage } from '@/lib/docs/render'
import { docsRoutes, findRoute, getDocsSite, type DocsRoute, type DocsSite } from '@/lib/docs/site'
import { docsPath } from '@/lib/docs/sitemap'
import { isPublished, schemaGroup } from '@/lib/openapi/reference'
import { OG_IMAGE } from '@/lib/seo'

// Every page under /docs/ (guides of every version, and the generated API reference) is one route rendered at build
// time; a slug that is not generated is a 404 of the static export.
export const dynamicParams = false

interface DocsPageProps {
  readonly params: Promise<{ readonly slug?: readonly string[] | undefined }>
}

export function generateStaticParams(): { slug: string[] }[] {
  return docsRoutes(getDocsSite()).map(({ slug }) => ({ slug: [...slug] }))
}

interface Description {
  readonly title: string
  readonly description: string
}

function describe(route: DocsRoute, docs: DocsSite, messages: Messages): Description {
  const text = messages.docs
  switch (route.kind) {
    case 'page':
      return {
        title: route.version.latest
          ? route.page.frontmatter.title
          : `${route.page.frontmatter.title} (${route.version.label})`,
        description: route.page.frontmatter.description,
      }
    case 'home':
      return { title: text.home.title, description: text.description }
    case 'api-overview':
      return {
        title: text.api.title,
        description:
          docs.api === null
            ? text.api.missing
            : isPublished(docs.api)
              ? text.api.description
              : text.api.notServed,
      }
    case 'api-tag':
      return {
        title: `${route.tag.title} · ${text.api.title}`,
        description: tagDescription(route.tag, messages),
      }
    case 'api-schemas':
      return { title: `${text.api.schemas} · ${text.api.title}`, description: text.api.schemasDescription }
  }
}

export async function generateMetadata({ params }: DocsPageProps): Promise<Metadata> {
  const { slug = [] } = await params
  const docs = getDocsSite()
  const route = findRoute(docs, slug)
  if (route === null) return {}
  const messages = getMessages()
  const { title, description } = describe(route, docs, messages)
  const url = docsPath(slug)
  const full = `${title} · ${messages.meta.siteName} ${messages.docs.title}`
  return {
    title: { absolute: full },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      siteName: messages.meta.siteName,
      title: full,
      description,
      url,
      locale: 'en_US',
      // Next.js replaces the root's openGraph and twitter objects, it does not merge them: the image comes back here.
      images: [{ ...OG_IMAGE, alt: full }],
    },
    twitter: { card: 'summary_large_image', title: full, description, images: [OG_IMAGE.url] },
  }
}

function apiToc(route: DocsRoute, docs: DocsSite, messages: Messages): TocItem[] {
  if (route.kind === 'api-tag') {
    return route.tag.operations.map((operation) => ({
      id: operation.anchor,
      text: splitSummary(operation.summary).title,
      depth: 2 as const,
    }))
  }
  if (route.kind === 'api-schemas' && docs.api !== null) {
    // The index lists the groups in its body: it has no sections of its own.
    return docs.api.schemas
      .filter((schema) => route.group !== null && schemaGroup(schema.name) === route.group)
      .map((schema) => ({ id: schema.anchor, text: schema.name, depth: 2 as const }))
  }
  return docs.api !== null && isPublished(docs.api) ? overviewToc(messages.docs.api) : []
}

export default async function DocsPage({ params }: DocsPageProps): Promise<React.JSX.Element> {
  const { slug = [] } = await params
  const docs = getDocsSite()
  const route = findRoute(docs, slug)
  if (route === null) notFound()
  const messages = getMessages()
  const href = docsPath(slug)

  if (route.kind === 'page' || route.kind === 'home') {
    const { version } = route
    if (route.kind === 'home') {
      return (
        <DocsShell messages={messages} docs={docs} version={version} href={href} toc={[]}>
          <DocsHome messages={messages} />
        </DocsShell>
      )
    }
    const { frontmatter } = route.page
    const rendered = renderPage(version, route.page, markdownLabels(messages.docs))
    return (
      <DocsShell messages={messages} docs={docs} version={version} href={href} toc={rendered.toc}>
        <DocArticle
          title={frontmatter.title}
          description={frontmatter.description}
          status={frontmatter.status}
          labels={messages.docs.status}
        >
          <Prose html={rendered.html} />
        </DocArticle>
      </DocsShell>
    )
  }

  const toc = apiToc(route, docs, messages)
  return (
    <DocsShell messages={messages} docs={docs} version={docs.latest} href={href} toc={toc}>
      {route.kind === 'api-tag' ? (
        <ApiTagPage tag={route.tag} messages={messages} />
      ) : route.kind === 'api-schemas' && docs.api !== null ? (
        route.group === null ? (
          <ApiSchemasIndex api={docs.api} messages={messages} />
        ) : (
          <ApiSchemasPage api={docs.api} group={route.group} messages={messages} />
        )
      ) : (
        <ApiOverview api={docs.api} messages={messages} />
      )}
    </DocsShell>
  )
}
