import Link from 'next/link'
import type { Messages } from '@/i18n'
import { codeBlockHtml } from '@/lib/docs/code'
import { renderMarkdown, type TocItem } from '@/lib/docs/markdown'
import { apiTagHref } from '@/lib/docs/site'
import { fill } from '@/lib/docs/text'
import { isPublished, type ApiReference, type ApiTag } from '@/lib/openapi/reference'
import { DocArticle, Prose } from '../DocArticle'
import { OperationView } from './Operation'
import { SchemaDetails } from './SchemaView'

/** The sections of the overview, for its table of contents (their ids are the h2 ids below). */
export function overviewToc(labels: Messages['docs']['api']): TocItem[] {
  return [
    { id: 'base-url', text: labels.baseUrl, depth: 2 },
    { id: 'authentication', text: labels.authentication, depth: 2 },
    { id: 'errors', text: labels.errors, depth: 2 },
    { id: 'resources', text: labels.resources, depth: 2 },
  ]
}

/** `/docs/api/`: where the API is, how to authenticate, what an error looks like, and every resource. */
export function ApiOverview({
  api,
  messages,
}: {
  readonly api: ApiReference | null
  readonly messages: Messages
}): React.JSX.Element {
  const text = messages.docs.api
  if (api === null || !isPublished(api)) {
    return (
      <DocArticle
        title={text.title}
        description={text.description}
        status="coming-soon"
        labels={messages.docs.status}
      >
        <div className="docs-prose">
          <p>{api === null ? text.missing : text.notServed}</p>
        </div>
      </DocArticle>
    )
  }
  const copy = messages.docs.code.copy
  return (
    <DocArticle
      title={text.title}
      description={text.description}
      status="available"
      labels={messages.docs.status}
    >
      <p className="api-version">
        <span className="badge">{fill(text.version, { version: api.version })}</span>
      </p>
      {api.description === null ? null : (
        <Prose
          html={renderMarkdown(api.description, { copyLabel: copy, rewriteHref: (href) => href }).html}
        />
      )}
      <div className="docs-prose">
        <h2 id="base-url">
          <a href="#base-url">{text.baseUrl}</a>
        </h2>
        <p>{text.baseUrlBody}</p>
        <div
          dangerouslySetInnerHTML={{
            __html: codeBlockHtml(api.baseUrl, { language: 'text', meta: null, copyLabel: copy }),
          }}
        />
        {api.servers.length === 0 ? null : (
          <>
            <p>{text.servers}</p>
            <ul>
              {api.servers.map((server) => (
                <li key={server.url}>
                  <code>{server.url}</code>
                  {server.description === null ? null : ` · ${server.description}`}
                </li>
              ))}
            </ul>
          </>
        )}
        <h2 id="authentication">
          <a href="#authentication">{text.authentication}</a>
        </h2>
        <p>{text.authenticationBody}</p>
        <ul>
          {api.authentication.map((scheme) => (
            <li key={scheme.name}>
              <code>{scheme.name}</code> · {scheme.type}
              {scheme.scheme === null ? null : ` ${scheme.scheme}`}
              {scheme.description === null ? null : ` · ${scheme.description}`}
            </li>
          ))}
        </ul>
        <h2 id="errors">
          <a href="#errors">{text.errors}</a>
        </h2>
        <p>{text.errorsBody}</p>
        <p className="api-statuses">
          {api.statuses.map((status) => (
            <span key={status} className={`api-status api-status--${status.charAt(0)}xx`}>
              {status}
            </span>
          ))}
        </p>
        {api.error.example === null ? null : (
          <div
            dangerouslySetInnerHTML={{
              __html: codeBlockHtml(api.error.example, {
                language: 'json',
                meta: null,
                copyLabel: copy,
                title: text.errors,
              }),
            }}
          />
        )}
        {api.error.schema === null ? null : (
          <SchemaDetails node={api.error.schema} labels={text} folded={false} />
        )}
        <h2 id="resources">
          <a href="#resources">{text.resources}</a>
        </h2>
        <ul className="api-resources">
          {api.tags.map((tag) => (
            <li key={tag.slug}>
              <Link href={apiTagHref(tag)} prefetch={false}>
                {tag.title}
              </Link>
              <span className="muted small">
                {fill(text.endpoints, { count: String(tag.operations.length) })}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </DocArticle>
  )
}

/** The description of a tag page: the contract's, else a sentence that names the resource. */
export function tagDescription(tag: ApiTag, messages: Messages): string {
  return tag.description ?? fill(messages.docs.api.tagDescription, { tag: tag.title })
}

/** `/docs/api/<tag>/`: every operation of one resource. */
export function ApiTagPage({
  tag,
  messages,
}: {
  readonly tag: ApiTag
  readonly messages: Messages
}): React.JSX.Element {
  return (
    <DocArticle
      title={tag.title}
      description={tagDescription(tag, messages)}
      status="available"
      labels={messages.docs.status}
    >
      {tag.operations.map((operation) => (
        <OperationView
          key={operation.anchor}
          operation={operation}
          labels={messages.docs.api}
          copyLabel={messages.docs.code.copy}
        />
      ))}
    </DocArticle>
  )
}

/** `/docs/api/schemas/`: every component schema, with its fields; nested named schemas link to their own entry. */
export function ApiSchemasPage({
  api,
  messages,
}: {
  readonly api: ApiReference
  readonly messages: Messages
}): React.JSX.Element {
  const text = messages.docs.api
  return (
    <DocArticle
      title={text.schemas}
      description={text.schemasDescription}
      status="available"
      labels={messages.docs.status}
    >
      {api.schemas.map((schema) => (
        <section key={schema.name} className="api-schema" aria-labelledby={schema.anchor}>
          <h2 id={schema.anchor}>
            <a href={`#${schema.anchor}`}>{schema.name}</a>
          </h2>
          <SchemaDetails node={schema.node} labels={text} folded={false} />
        </section>
      ))}
    </DocArticle>
  )
}
