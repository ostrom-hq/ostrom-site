// SPDX-License-Identifier: Apache-2.0
import type { Element, ElementContent, Properties } from 'hast'
import { toHtml } from 'hast-util-to-html'
import type { Messages } from '@/i18n'
import { codeBlock } from '@/lib/docs/code'
import { fill } from '@/lib/docs/text'
import {
  schemaAnchor,
  type ApiOperation,
  type ApiReference,
  type ApiResponse,
  type ApiTag,
} from './reference'
import { childProperties, typeLabel, type PropertyNode, type SchemaNode } from './schema'

// The heavy half of the API reference (fields, responses, examples), written as HTML at build time into one JSON file
// per page under /docs/api-data/. A page shows its operations and schemas by name; their details load when the reader
// opens them (ApiDataListener), so no page carries thousands of elements for the browser to parse and hydrate.

export type ApiLabels = Messages['docs']['api']

export const API_DATA_BASE = '/docs/api-data'
/** The data file of the Schemas page; a tag cannot be named "schemas" (site.ts), so no tag file shares its name. */
export const SCHEMAS_DATA = 'schemas.json'
const SCHEMAS_HREF = '/docs/api/schemas/'

type Child = ElementContent

const text = (value: string): Child => ({ type: 'text', value })

function h(tagName: string, properties: Properties, children: readonly Child[] = []): Element {
  return { type: 'element', tagName, properties, children: [...children] }
}

/** Text from the OpenAPI description, with its `code` spans shown as code. */
export function inlineText(value: string): Child[] {
  return value
    .split(/`([^`]+)`/)
    .flatMap((part, position): Child[] =>
      position % 2 === 1 ? [h('code', {}, [text(part)])] : part === '' ? [] : [text(part)],
    )
}

/** The type of a field; every named schema links to its entry on the Schemas page. */
export function typeText(node: SchemaNode): Child[] {
  if (node.kind === 'array') return [text('array of '), ...typeText(node.items)]
  if (node.kind === 'union') {
    return node.options.flatMap((option, position) => [
      ...(position > 0 ? [text(' or ')] : []),
      ...typeText(option),
    ])
  }
  const name = node.kind === 'link' ? node.target : node.name
  if (name === null) return [text(typeLabel(node))]
  return [h('a', { href: `${SCHEMAS_HREF}#${schemaAnchor(name)}` }, [text(name)])]
}

const flag = (label: string, required = false): Element =>
  h(
    'span',
    { className: required ? ['api-field__flag', 'api-field__flag--required'] : ['api-field__flag'] },
    [text(label)],
  )

export interface FieldHeadOptions {
  readonly name: string
  readonly node: SchemaNode | null
  readonly required: boolean
  readonly deprecated: boolean
  readonly location?: string
}

/** The first line of a field: `name` type, and its flags. */
export function fieldHead(field: FieldHeadOptions, labels: ApiLabels): Element {
  const children: Child[] = [h('code', { className: ['api-field__name'] }, [text(field.name)])]
  if (field.node !== null) children.push(h('span', { className: ['api-field__type'] }, typeText(field.node)))
  if (field.location !== undefined) children.push(flag(field.location))
  if (field.required) children.push(flag(labels.required, true))
  if (field.node?.nullable === true) children.push(flag(labels.nullable))
  if (field.deprecated) children.push(flag(labels.deprecated))
  return h('p', { className: ['api-field__head'] }, children)
}

const meta = (children: readonly Child[]): Element => h('p', { className: ['api-field__meta'] }, children)

/** What a schema says below its line: description, allowed values, default, other keys, then its own fields. */
export function schemaDetails(node: SchemaNode, labels: ApiLabels, folded: boolean): Child[] {
  const out: Child[] = []
  if (node.description !== null) {
    out.push(h('p', { className: ['api-field__description'] }, inlineText(node.description)))
  }
  if (node.kind === 'scalar' && node.values.length > 0) {
    out.push(
      meta([
        text(`${labels.values} `),
        ...node.values.flatMap((value, position) => [
          ...(position > 0 ? [text(', ')] : []),
          h('code', {}, [text(value)]),
        ]),
      ]),
    )
  }
  if (node.kind === 'scalar' && node.defaultValue !== null) {
    out.push(meta([text(`${labels.defaultValue} `), h('code', {}, [text(node.defaultValue)])]))
  }
  if (node.kind === 'object' && node.additional !== null) {
    out.push(meta([text(`${labels.additional} `), ...typeText(node.additional)]))
  }
  const children = childProperties(node)
  if (children.length > 0) {
    const list = properties(children, labels)
    // Nested fields fold behind "Show n fields" (Stripe's child attributes); the top level is open.
    out.push(
      folded
        ? h('details', { className: ['api-children'] }, [
            h('summary', {}, [text(fill(labels.children, { count: String(children.length) }))]),
            list,
          ])
        : list,
    )
  }
  return out
}

/** A list of fields: name, type, required, then the details of each. */
export function properties(list: readonly PropertyNode[], labels: ApiLabels): Element {
  return h(
    'ul',
    { className: ['api-fields'] },
    list.map((property) =>
      h('li', { className: ['api-field'] }, [
        fieldHead(
          {
            name: property.name,
            node: property.schema,
            required: property.required,
            deprecated: property.deprecated,
          },
          labels,
        ),
        ...schemaDetails(property.schema, labels, true),
      ]),
    ),
  )
}

/** One response: its status and description; with a body, the body's type and fields behind a toggle. */
export function responseItem(response: ApiResponse, labels: ApiLabels): Element {
  const head: Child[] = [
    h('span', { className: ['api-status', `api-status--${response.status.charAt(0)}xx`] }, [
      text(response.status),
    ]),
  ]
  if (response.description !== null) {
    head.push(h('span', { className: ['api-response__description'] }, inlineText(response.description)))
  }
  if (response.schema === null) return h('li', { className: ['api-response'] }, head)
  return h('li', { className: ['api-response'] }, [
    h('details', {}, [
      h('summary', {}, head),
      h('p', { className: ['api-field__head'] }, [
        h('span', { className: ['api-field__type'] }, typeText(response.schema)),
      ]),
      ...schemaDetails({ ...response.schema, description: null }, labels, false),
    ]),
  ])
}

/** The details of an endpoint: parameters, body and responses on the left, a curl and its response on the right. */
export function operationDetails(operation: ApiOperation, labels: ApiLabels, copyLabel: string): Element {
  const doc: Child[] = []
  if (operation.parameters.length > 0) {
    doc.push(
      h('h3', {}, [text(labels.parameters)]),
      h(
        'ul',
        { className: ['api-fields'] },
        operation.parameters.map((parameter) =>
          h('li', { className: ['api-field'] }, [
            fieldHead(
              {
                name: parameter.name,
                node: parameter.schema,
                required: parameter.required,
                deprecated: parameter.deprecated,
                location: parameter.location,
              },
              labels,
            ),
            ...(parameter.description === null
              ? []
              : [h('p', { className: ['api-field__description'] }, inlineText(parameter.description))]),
          ]),
        ),
      ),
    )
  }
  const body = operation.body
  if (body !== null) {
    doc.push(
      h('h3', {}, [text(labels.body)]),
      meta([
        h('code', {}, [text(body.contentType)]),
        ...(body.required ? [flag(labels.required, true)] : []),
      ]),
    )
    if (body.description !== null) doc.push(h('p', {}, inlineText(body.description)))
    if (body.schema !== null) doc.push(...schemaDetails(body.schema, labels, false))
  }
  doc.push(
    h('h3', {}, [text(labels.responses)]),
    h(
      'ul',
      { className: ['api-responses'] },
      operation.responses.map((response) => responseItem(response, labels)),
    ),
  )
  const examples: Child[] = [
    codeBlock(operation.curl, { language: 'shellscript', meta: null, copyLabel, title: labels.request }),
  ]
  const example = operation.responseExample
  if (example !== null) {
    examples.push(
      codeBlock(example.json, {
        language: 'json',
        meta: null,
        copyLabel,
        title: fill(labels.response, { status: example.status }),
      }),
    )
  }
  return h('div', { className: ['api-op__grid'] }, [
    h('div', { className: ['api-op__doc'] }, doc),
    h('div', { className: ['api-op__examples'] }, examples),
  ])
}

/** A schema's details as HTML: description, values, default, other keys and fields. */
export function schemaDetailsHtml(node: SchemaNode, labels: ApiLabels): string {
  return toHtml(schemaDetails(node, labels, false))
}

/** The data file of a tag page. */
export function tagDataFile(tag: ApiTag): string {
  return `${tag.slug}.json`
}

export function apiDataHref(file: string): string {
  return `${API_DATA_BASE}/${file}`
}

/** Every data file the static export writes: one per tag, and the Schemas page's (never none, for the export). */
export function apiDataFiles(api: ApiReference | null): string[] {
  return [...(api?.tags ?? []).map(tagDataFile), SCHEMAS_DATA]
}

/** The content of one data file: the HTML of each operation of a tag, or of each schema, by its anchor. */
export function apiData(
  api: ApiReference | null,
  file: string,
  labels: ApiLabels,
  copyLabel: string,
): Record<string, string> {
  const data: Record<string, string> = {}
  if (api === null) return data
  if (file === SCHEMAS_DATA) {
    for (const schema of api.schemas) {
      data[schema.anchor] = schemaDetailsHtml({ ...schema.node, description: null }, labels)
    }
    return data
  }
  for (const tag of api.tags) {
    if (tagDataFile(tag) !== file) continue
    for (const operation of tag.operations) {
      data[operation.anchor] = toHtml(operationDetails(operation, labels, copyLabel))
    }
  }
  return data
}
