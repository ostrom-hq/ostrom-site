import Link from 'next/link'
import type { Messages } from '@/i18n'
import { API_SCHEMAS_HREF } from '@/lib/docs/site'
import { fill } from '@/lib/docs/text'
import { schemaAnchor } from '@/lib/openapi/reference'
import { childProperties, typeLabel, type PropertyNode, type SchemaNode } from '@/lib/openapi/schema'
import { InlineText } from './InlineText'

export type ApiLabels = Messages['docs']['api']

/** The type of a field; every named schema links to its entry on the Schemas page. */
export function TypeText({ node }: { readonly node: SchemaNode }): React.JSX.Element {
  if (node.kind === 'array') {
    return (
      <>
        array of <TypeText node={node.items} />
      </>
    )
  }
  if (node.kind === 'union') {
    return (
      <>
        {node.options.map((option, position) => (
          <span key={position}>
            {position > 0 ? ' or ' : null}
            <TypeText node={option} />
          </span>
        ))}
      </>
    )
  }
  const name = node.kind === 'link' ? node.target : node.name
  if (name === null) return <>{typeLabel(node)}</>
  return (
    <Link href={`${API_SCHEMAS_HREF}#${schemaAnchor(name)}`} prefetch={false}>
      {name}
    </Link>
  )
}

/** What a schema says below its line: description, allowed values, default, other keys, then its own fields. */
export function SchemaDetails({
  node,
  labels,
  folded,
}: {
  readonly node: SchemaNode
  readonly labels: ApiLabels
  /** Nested fields fold behind "Show n fields" (Stripe's child attributes); the top level is open. */
  readonly folded: boolean
}): React.JSX.Element {
  const children = childProperties(node)
  return (
    <>
      {node.description === null ? null : (
        <p className="api-field__description">
          <InlineText text={node.description} />
        </p>
      )}
      {node.kind === 'scalar' && node.values.length > 0 ? (
        <p className="api-field__meta">
          {labels.values}{' '}
          {node.values.map((value, position) => (
            <span key={value}>
              {position > 0 ? ', ' : null}
              <code>{value}</code>
            </span>
          ))}
        </p>
      ) : null}
      {node.kind === 'scalar' && node.defaultValue !== null ? (
        <p className="api-field__meta">
          {labels.defaultValue} <code>{node.defaultValue}</code>
        </p>
      ) : null}
      {node.kind === 'object' && node.additional !== null ? (
        <p className="api-field__meta">
          {labels.additional} <TypeText node={node.additional} />
        </p>
      ) : null}
      {children.length === 0 ? null : folded ? (
        <details className="api-children">
          <summary>{fill(labels.children, { count: String(children.length) })}</summary>
          <Properties properties={children} labels={labels} />
        </details>
      ) : (
        <Properties properties={children} labels={labels} />
      )}
    </>
  )
}

/** A list of fields: name, type, required, then the details of each. */
export function Properties({
  properties,
  labels,
}: {
  readonly properties: readonly PropertyNode[]
  readonly labels: ApiLabels
}): React.JSX.Element {
  return (
    <ul className="api-fields">
      {properties.map((property) => (
        <li key={property.name} className="api-field">
          <FieldHead
            name={property.name}
            node={property.schema}
            required={property.required}
            deprecated={property.deprecated}
            labels={labels}
          />
          <SchemaDetails node={property.schema} labels={labels} folded />
        </li>
      ))}
    </ul>
  )
}

/** The first line of a field: `name` type, and its flags. */
export function FieldHead({
  name,
  node,
  required,
  deprecated,
  labels,
  location,
}: {
  readonly name: string
  readonly node: SchemaNode | null
  readonly required: boolean
  readonly deprecated: boolean
  readonly labels: ApiLabels
  readonly location?: string
}): React.JSX.Element {
  return (
    <p className="api-field__head">
      <code className="api-field__name">{name}</code>
      {node === null ? null : (
        <span className="api-field__type">
          <TypeText node={node} />
        </span>
      )}
      {location === undefined ? null : <span className="api-field__flag">{location}</span>}
      {required ? <span className="api-field__flag api-field__flag--required">{labels.required}</span> : null}
      {node?.nullable === true ? <span className="api-field__flag">{labels.nullable}</span> : null}
      {deprecated ? <span className="api-field__flag">{labels.deprecated}</span> : null}
    </p>
  )
}
