// SPDX-License-Identifier: Apache-2.0
import Link from 'next/link'
import type { Messages } from '@/i18n'
import { codeBlockHtml } from '@/lib/docs/code'
import type { TocItem } from '@/lib/docs/markdown'
import { apiTagHref, schemasGroupHref } from '@/lib/docs/site'
import { fill } from '@/lib/docs/text'
import {
  schemasDataFile,
  apiDataHref,
  schemaDetails,
  schemaDetailsHtml,
  tagDataFile,
  type ApiLabels,
} from '@/lib/openapi/html'
import { isPublished, schemaGroup, schemaGroups, type ApiOperation, type ApiReference, type ApiTag } from '@/lib/openapi/reference'
import { DocArticle } from '../DocArticle'
import { ApiDataListener } from './ApiDataListener'
import { InlineText, splitSummary } from './InlineText'

/** The sections of the overview, for its table of contents (their ids are the h2 ids below). */
export function overviewToc(labels: Messages['docs']['api']): TocItem[] {
  return [
    { id: 'base-url', text: labels.baseUrl, depth: 2 },
    { id: 'authentication', text: labels.authentication, depth: 2 },
    { id: 'errors', text: labels.errors, depth: 2 },
    { id: 'resources', text: labels.resources, depth: 2 },
  ]
}

/**
 * `/docs/api/`: where the API is, how to authenticate, what an error looks like, and every resource. The words are the
 * site's (en.ts), not the contract's: its description names internal repositories and its servers a local host, and
 * neither Ostrom Cloud nor self-hosting has shipped (PB-W4).
 */
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
      {/* The site's own words: the contract's description and servers are written for its maintainers. */}
      <div className="docs-prose">
        <p>{text.intro}</p>
        <h2 id="base-url">
          <a href="#base-url">{text.baseUrl}</a>
        </h2>
        <p>{text.baseUrlBody}</p>
        <div
          dangerouslySetInnerHTML={{
            __html: codeBlockHtml(api.baseUrl, { language: 'text', meta: null, copyLabel: copy }),
          }}
        />
        <h2 id="authentication">
          <a href="#authentication">{text.authentication}</a>
        </h2>
        <p>{text.authenticationBody}</p>
        <ul>
          {api.authentication.map((scheme) => (
            <li key={scheme.name}>
              <code>{scheme.name}</code> · {scheme.type}
              {scheme.scheme === null ? null : ` ${scheme.scheme}`}
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
          <div dangerouslySetInnerHTML={{ __html: schemaDetailsHtml(api.error.schema, text) }} />
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

/** The HTTP method, coloured by what it does (read, create, change, delete). */
export function MethodBadge({ method }: { readonly method: string }): React.JSX.Element {
  return <span className={`api-method api-method--${method}`}>{method.toUpperCase()}</span>
}

/** A toggle whose content loads when it opens: the HTML of `id` in the data file `src` (ApiDataListener). */
export function ApiMore({
  src,
  id,
  summary,
}: {
  readonly src: string
  readonly id: string
  readonly summary: string
}): React.JSX.Element {
  return (
    <details className="api-more" data-api-data={src} data-api-key={id}>
      <summary>{summary}</summary>
    </details>
  )
}

function listenerLabels(text: ApiLabels): { readonly loading: string; readonly failed: string } {
  return { loading: text.loading, failed: text.loadFailed }
}

/** One endpoint by name: its route and what it does; parameters, body, responses and examples open on demand. */
export function OperationSummary({
  operation,
  src,
  labels,
}: {
  readonly operation: ApiOperation
  readonly src: string
  readonly labels: ApiLabels
}): React.JSX.Element {
  const { title, rest } = splitSummary(operation.summary)
  return (
    <section className="api-op" aria-labelledby={operation.anchor}>
      <h2 id={operation.anchor}>
        <a href={`#${operation.anchor}`}>{title}</a>
      </h2>
      <p className="api-op__route">
        <MethodBadge method={operation.method} />
        <code className="api-op__path">{operation.path}</code>
        {operation.authenticated ? null : <span className="badge">{labels.public}</span>}
        {operation.deprecated ? <span className="badge badge--warning">{labels.deprecated}</span> : null}
      </p>
      {[rest, operation.description].map((paragraph, position) =>
        paragraph === null ? null : (
          <p key={position}>
            <InlineText text={paragraph} />
          </p>
        ),
      )}
      <ApiMore src={src} id={operation.anchor} summary={labels.details} />
    </section>
  )
}

/** `/docs/api/<tag>/`: every operation of one resource. */
export function ApiTagPage({
  tag,
  messages,
}: {
  readonly tag: ApiTag
  readonly messages: Messages
}): React.JSX.Element {
  const text = messages.docs.api
  const src = apiDataHref(tagDataFile(tag))
  return (
    <DocArticle
      title={tag.title}
      description={tagDescription(tag, messages)}
      status="available"
      labels={messages.docs.status}
    >
      {tag.operations.map((operation) => (
        <OperationSummary key={operation.anchor} operation={operation} src={src} labels={text} />
      ))}
      <ApiDataListener labels={listenerLabels(text)} />
    </DocArticle>
  )
}

/** `/docs/api/schemas/`: the groups of schemas, one page per initial. */
export function ApiSchemasIndex({
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
      <ul>
        {schemaGroups(api.schemas).map(({ group, count }) => (
          <li key={group}>
            <Link href={schemasGroupHref(group)} prefetch={false}>{group === 'other' ? text.schemasOther : group.toUpperCase()}</Link> (
            {count})
          </li>
        ))}
      </ul>
    </DocArticle>
  )
}

/** `/docs/api/schemas/<initial>/`: the component schemas of one initial by name; their fields open on demand. */
export function ApiSchemasPage({
  api,
  group,
  messages,
}: {
  readonly api: ApiReference
  readonly group: string
  readonly messages: Messages
}): React.JSX.Element {
  const text = messages.docs.api
  const src = apiDataHref(schemasDataFile(group))
  const title = `${text.schemas}: ${group === 'other' ? text.schemasOther : group.toUpperCase()}`
  return (
    <DocArticle title={title} description={text.schemasDescription} status="available" labels={messages.docs.status}>
      {api.schemas
        .filter((schema) => schemaGroup(schema.name) === group)
        .map((schema) => (
          <section key={schema.name} className="api-schema" aria-labelledby={schema.anchor}>
            <h2 id={schema.anchor}>
              <a href={`#${schema.anchor}`}>{schema.name}</a>
            </h2>
            {schema.node.description === null ? null : (
              <p className="api-field__description">
                <InlineText text={schema.node.description} />
              </p>
            )}
            {schemaDetails({ ...schema.node, description: null }, text, false).length === 0 ? null : (
              <ApiMore src={src} id={schema.anchor} summary={text.schemaDetails} />
            )}
          </section>
        ))}
      <ApiDataListener labels={listenerLabels(text)} />
    </DocArticle>
  )
}
