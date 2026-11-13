// SPDX-License-Identifier: Apache-2.0
import { screen, within } from '@testing-library/react'
import type { ElementContent } from 'hast'
import { toHtml } from 'hast-util-to-html'
import { en } from '@/i18n/en'
import { fixtureSite } from '@/test/docs'
import {
  apiData,
  apiDataFiles,
  apiDataHref,
  fieldHead,
  inlineText,
  operationDetails,
  responseItem,
  schemaDetails,
  schemaDetailsHtml,
  tagDataFile,
  typeText,
} from './html'
import { schemaGroups, type ApiOperation } from './reference'
import { resolveSchema, type SchemaNode } from './schema'

const labels = en.docs.api
const api = fixtureSite().api
if (api === null) throw new Error('the fixture has an API description')

const node = (schema: Parameters<typeof resolveSchema>[0]): SchemaNode =>
  resolveSchema(schema, { schemas: {}, maxDepth: 2 })

function operation(anchor: string): ApiOperation {
  const found = api?.tags.flatMap((tag) => tag.operations).find((candidate) => candidate.anchor === anchor)
  if (found === undefined) throw new Error(`no operation ${anchor}`)
  return found
}

/** Puts HTML in the document, as the listener does, and returns its container. */
function show(content: ElementContent | readonly ElementContent[] | string): HTMLElement {
  const container = document.createElement('div')
  container.innerHTML = typeof content === 'string' ? content : toHtml([content].flat())
  document.body.replaceChildren(container)
  return container
}

const link = (name: string): string | null => screen.getByRole('link', { name }).getAttribute('href')

describe('inlineText', () => {
  it('shows code spans as code', () => {
    const container = show({
      type: 'element',
      tagName: 'p',
      properties: {},
      children: inlineText('`a` then `b`'),
    })
    expect(container.querySelectorAll('code')).toHaveLength(2)
    expect(container).toHaveTextContent('a then b')
  })
})

describe('typeText', () => {
  it('names types, and links named schemas to the Schemas page', () => {
    const container = show([
      ...typeText(node({ type: 'array', items: { type: 'string' } })),
      ...typeText(node({ oneOf: [{ type: 'string' }, { type: 'integer' }] })),
      ...typeText({ ...node({ type: 'object' }), name: 'Gate' }),
      ...typeText({ kind: 'link', target: 'Node', name: null, description: null, nullable: false }),
    ])
    expect(container).toHaveTextContent('array of stringstring or integerGateNode')
    expect(link('Gate')).toBe('/docs/api/schemas/g/#schema-gate')
    expect(link('Node')).toBe('/docs/api/schemas/n/#schema-node')
  })
})

describe('schemaDetails', () => {
  it('shows the description, the values, the default and the other keys', () => {
    show([
      ...schemaDetails(
        node({ type: 'string', description: 'A `mode`', enum: ['a', 'b'], default: 'a' }),
        labels,
        false,
      ),
      ...schemaDetails(node({ type: 'object', additionalProperties: { type: 'string' } }), labels, false),
    ])
    expect(screen.getByText(labels.values, { exact: false })).toHaveTextContent('One of: a, b')
    expect(screen.getByText(labels.defaultValue, { exact: false })).toHaveTextContent('Default: a')
    expect(screen.getByText(labels.additional, { exact: false })).toHaveTextContent('Any other key: string')
    expect(screen.getByText('mode', { selector: 'code' })).toBeInTheDocument()
  })

  it('folds nested fields and opens the top level', () => {
    const object = node({
      type: 'object',
      properties: { outer: { type: 'object', properties: { inner: { type: 'string' } } } },
      required: ['outer'],
    })
    const container = show(schemaDetails(object, labels, false))
    expect(container.querySelectorAll('details')).toHaveLength(1)
    expect(screen.getByText('Show 1 fields')).toBeInTheDocument()
    expect(screen.getByText(labels.required)).toHaveClass('api-field__flag--required')
    expect(schemaDetails(node({ type: 'string' }), labels, false)).toEqual([])
  })

  it('writes the same as HTML', () => {
    show(schemaDetailsHtml(node({ type: 'string', enum: ['x'] }), labels))
    expect(screen.getByText('x', { selector: 'code' })).toBeInTheDocument()
  })
})

describe('fieldHead', () => {
  it('heads a field with its type and flags', () => {
    show([
      fieldHead(
        {
          name: 'a',
          node: { ...node({ type: 'string' }), nullable: true },
          required: false,
          deprecated: true,
          location: 'query',
        },
        labels,
      ),
      fieldHead({ name: 'b', node: null, required: true, deprecated: false }, labels),
    ])
    expect(screen.getByText('a').parentElement).toHaveTextContent('astringquerynullabledeprecated')
    expect(screen.getByText('b').parentElement).toHaveTextContent('brequired')
  })
})

describe('responseItem', () => {
  it('shows a response with its body behind a toggle, or without anything', () => {
    show([
      responseItem(
        {
          status: '201',
          description: 'Created',
          contentType: 'application/json',
          schema: node({ type: 'string' }),
        },
        labels,
      ),
      responseItem({ status: '500', description: null, contentType: null, schema: null }, labels),
    ])
    expect(screen.getByText('Created').closest('details')).not.toBeNull()
    expect(screen.getByText('500')).toHaveClass('api-status--5xx')
    expect(screen.getByText('500').closest('details')).toBeNull()
  })
})

describe('operationDetails', () => {
  it('shows parameters, body, responses, a curl and the response', () => {
    const container = show(operationDetails(operation('requestgate'), labels, 'Copy'))
    expect(screen.getByText('Seconds to wait')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: labels.body })).toBeInTheDocument()
    expect(screen.getByText('What to ask for')).toBeInTheDocument()
    expect(screen.getByText('Created')).toBeInTheDocument()
    expect(screen.getByText('Response 201')).toBeInTheDocument()
    expect(within(container).getAllByRole('button', { name: 'Copy' })).toHaveLength(2)
  })

  it('handles bodies without schema, and operations without parameters or JSON response', () => {
    show(operationDetails(operation('deletegate'), labels, 'Copy'))
    expect(screen.getByText('application/octet-stream')).toBeInTheDocument()
    show(operationDetails(operation('health'), labels, 'Copy'))
    expect(screen.queryByRole('heading', { name: labels.parameters })).toBeNull()
    expect(screen.getByText(labels.responses)).toBeInTheDocument()
    show(operationDetails(operation('get-apiv1gates'), labels, 'Copy'))
    expect(screen.getByText('Redirect')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Copy' })).toHaveLength(1)
  })
})

describe('the data files', () => {
  it('are one per tag and one for the schemas, never none', () => {
    const gates = api.tags[0]
    if (gates === undefined) throw new Error('the fixture has a tag')
    expect(tagDataFile(gates)).toBe('approvals.json')
    expect(apiDataHref('approvals.json')).toBe('/docs/api-data/approvals.json')
    expect(apiDataFiles(api)).toEqual([
      ...api.tags.map((tag) => `${tag.slug}.json`),
      ...schemaGroups(api.schemas).map(({ group }) => `schemas-${group}.json`),
    ])
    expect(apiDataFiles(null)).toEqual([])
  })

  it('hold the HTML of each operation of a tag, and of each schema, by anchor', () => {
    const tag = apiData(api, 'approvals.json', labels, 'Copy')
    expect(Object.keys(tag)).toEqual(api.tags[0]?.operations.map((entry) => entry.anchor))
    show(tag['requestgate'] ?? '')
    expect(screen.getByText('Seconds to wait')).toBeInTheDocument()
    const schemas = apiData(api, 'schemas-g.json', labels, 'Copy')
    expect(Object.keys(schemas)).toEqual(
      api.schemas.filter((schema) => schema.name.startsWith('G')).map((schema) => schema.anchor),
    )
    show(schemas['schema-gatestatus'] ?? '')
    // The description is on the page, above the toggle: only the values are in the data.
    expect(screen.queryByText('Where the gate stands')).toBeNull()
    expect(screen.getByText('pending', { selector: 'code' })).toBeInTheDocument()
    expect(apiData(api, 'nope.json', labels, 'Copy')).toEqual({})
    expect(apiData(null, 'schemas-g.json', labels, 'Copy')).toEqual({})
  })
})
