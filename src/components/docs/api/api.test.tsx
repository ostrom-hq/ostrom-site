// SPDX-License-Identifier: Apache-2.0
import { render, screen, within } from '@testing-library/react'
import { en } from '@/i18n/en'
import { buildApiReference, type ApiOperation, type ApiReference } from '@/lib/openapi/reference'
import { resolveSchema, type SchemaNode } from '@/lib/openapi/schema'
import { TEST_API_URL, fixtureSite, linkTarget } from '@/test/docs'
import { ApiOverview, ApiSchemasPage, ApiTagPage, overviewToc, tagDescription } from './ApiPages'
import { InlineText, splitSummary } from './InlineText'
import { MethodBadge, OperationView } from './Operation'
import { FieldHead, SchemaDetails, TypeText } from './SchemaView'

const labels = en.docs.api
const api = fixtureSite().api
if (api === null) throw new Error('the fixture has an API description')
const [gates, other] = api.tags
if (gates === undefined || other === undefined) throw new Error('the fixture has two tags')

const node = (schema: Parameters<typeof resolveSchema>[0]): SchemaNode =>
  resolveSchema(schema, { schemas: {}, maxDepth: 2 })

function operation(anchor: string): ApiOperation {
  const found = api?.tags.flatMap((tag) => tag.operations).find((candidate) => candidate.anchor === anchor)
  if (found === undefined) throw new Error(`no operation ${anchor}`)
  return found
}

describe('InlineText', () => {
  it('shows code spans as code', () => {
    const { container } = render(<InlineText text="`a` then `b` end" />)
    expect(container.querySelectorAll('code')).toHaveLength(2)
    expect(container).toHaveTextContent('a then b end')
  })

  it('splits a summary into a title and a first paragraph', () => {
    expect(splitSummary('Request a gate. It waits.')).toEqual({ title: 'Request a gate', rest: 'It waits.' })
    expect(splitSummary('Delete a gate.')).toEqual({ title: 'Delete a gate', rest: null })
  })
})

describe('TypeText', () => {
  it('names types, and links named schemas to the Schemas page', () => {
    const { container } = render(
      <>
        <TypeText node={node({ type: 'array', items: { type: 'string' } })} />
        <TypeText node={node({ oneOf: [{ type: 'string' }, { type: 'integer' }] })} />
        <TypeText node={{ ...node({ type: 'object' }), name: 'Gate' }} />
        <TypeText node={{ kind: 'link', target: 'Node', name: null, description: null, nullable: false }} />
      </>,
    )
    expect(container).toHaveTextContent('array of stringstring or integerGateNode')
    expect(linkTarget(screen.getByRole('link', { name: 'Gate' }))).toBe(linkTarget('/docs/api/schemas/#schema-gate'))
    expect(linkTarget(screen.getByRole('link', { name: 'Node' }))).toBe(linkTarget('/docs/api/schemas/#schema-node'))
  })
})

describe('SchemaDetails', () => {
  it('shows the description, the values, the default and the other keys', () => {
    render(
      <>
        <SchemaDetails
          node={node({ type: 'string', description: 'A `mode`', enum: ['a', 'b'], default: 'a' })}
          labels={labels}
          folded={false}
        />
        <SchemaDetails
          node={node({ type: 'object', additionalProperties: { type: 'string' } })}
          labels={labels}
          folded={false}
        />
      </>,
    )
    expect(screen.getByText(labels.values)).toHaveTextContent('One of: a, b')
    expect(screen.getByText(labels.defaultValue, { exact: false })).toHaveTextContent('Default: a')
    expect(screen.getByText(labels.additional, { exact: false })).toHaveTextContent('Any other key: string')
  })

  it('folds nested fields and opens the top level', () => {
    const object = node({
      type: 'object',
      properties: { outer: { type: 'object', properties: { inner: { type: 'string' } } } },
      required: ['outer'],
    })
    const { container } = render(<SchemaDetails node={object} labels={labels} folded={false} />)
    expect(container.querySelectorAll('details')).toHaveLength(1)
    expect(screen.getByText('Show 1 fields')).toBeInTheDocument()
    expect(screen.getByText(labels.required)).toBeInTheDocument()
  })

  it('heads a field with its type and flags', () => {
    render(
      <>
        <FieldHead
          name="a"
          node={{ ...node({ type: 'string' }), nullable: true }}
          required={false}
          deprecated
          labels={labels}
          location="query"
        />
        <FieldHead name="b" node={null} required deprecated={false} labels={labels} />
      </>,
    )
    expect(screen.getByText('a').parentElement).toHaveTextContent('astringquerynullabledeprecated')
    expect(screen.getByText('b').parentElement).toHaveTextContent('brequired')
  })
})

describe('OperationView', () => {
  it('shows an endpoint: route, parameters, body, responses, curl and response', () => {
    render(<OperationView operation={operation('requestgate')} labels={labels} copyLabel="Copy" />)
    const section = screen.getByRole('region', { name: 'Request a gate' })
    expect(within(section).getByText('POST', { selector: '.api-method' })).toHaveClass('api-method--post')
    expect(within(section).getByText('The agent waits for the', { exact: false })).toBeInTheDocument()
    expect(within(section).getByText('Seconds to wait')).toBeInTheDocument()
    expect(within(section).getByRole('heading', { name: labels.body })).toBeInTheDocument()
    expect(within(section).getByText('What to ask for')).toBeInTheDocument()
    expect(within(section).getByText('Created')).toBeInTheDocument()
    expect(within(section).getByText('Response 201')).toBeInTheDocument()
    expect(within(section).getAllByRole('button', { name: 'Copy' })).toHaveLength(2)
    expect(within(section).queryByText(labels.public)).toBeNull()
  })

  it('marks a public or deprecated endpoint and handles bodies without schema', () => {
    const { rerender } = render(
      <OperationView operation={operation('get-apiv1gates')} labels={labels} copyLabel="Copy" />,
    )
    expect(screen.getByText(labels.public)).toBeInTheDocument()
    expect(screen.getAllByText(labels.deprecated)[0]).toHaveClass('badge--warning')
    expect(screen.getByText('Redirect')).toBeInTheDocument()
    rerender(<OperationView operation={operation('deletegate')} labels={labels} copyLabel="Copy" />)
    expect(screen.getByText('application/octet-stream')).toBeInTheDocument()
    rerender(<OperationView operation={operation('health')} labels={labels} copyLabel="Copy" />)
    expect(screen.queryByRole('heading', { name: labels.parameters })).toBeNull()
    expect(screen.getByText(labels.responses)).toBeInTheDocument()
  })

  it('colours the method', () => {
    render(<MethodBadge method="delete" />)
    expect(screen.getByText('DELETE')).toHaveClass('api-method--delete')
  })

  it('shows a response without description', () => {
    const bare: ApiOperation = {
      ...operation('health'),
      responses: [{ status: '500', description: null, contentType: null, schema: null }],
    }
    render(<OperationView operation={bare} labels={labels} copyLabel="Copy" />)
    expect(screen.getByText('500')).toHaveClass('api-status--5xx')
  })
})

describe('the API pages', () => {
  it('say the description is missing, or that nothing is served yet', () => {
    const { rerender } = render(<ApiOverview api={null} messages={en} />)
    expect(screen.getByText(labels.missing)).toBeInTheDocument()
    expect(screen.getByText(en.docs.status.comingSoon)).toBeInTheDocument()
    const unserved = buildApiReference(
      { openapi: '3.1.0', info: { title: 'T', version: '1' }, paths: {} },
      TEST_API_URL,
    )
    rerender(<ApiOverview api={unserved} messages={en} />)
    expect(screen.getByText(labels.notServed)).toBeInTheDocument()
  })

  it('give the overview: base URL, servers, authentication, errors and resources', () => {
    render(<ApiOverview api={api} messages={en} />)
    expect(screen.getByText('Version 9.9.9')).toBeInTheDocument()
    expect(screen.getByText('fixture')).toBeInTheDocument()
    for (const item of overviewToc(labels))
      expect(screen.getByRole('heading', { name: item.text })).toHaveAttribute('id', item.id)
    expect(screen.getByText('https://localhost:4317/base')).toBeInTheDocument()
    expect(screen.getByText('An Ostrom token', { exact: false, selector: 'li' })).toBeInTheDocument()
    expect(screen.getByText('400')).toHaveClass('api-status--4xx')
    expect(linkTarget(screen.getByRole('link', { name: 'Gates' }))).toBe(linkTarget('/docs/api/gates/'))
    expect(screen.getByText('3 endpoints')).toBeInTheDocument()
  })

  it('give a bare overview for a bare description', () => {
    const bare: ApiReference = buildApiReference(
      {
        openapi: '3.1.0',
        info: { title: 'T', version: '1' },
        paths: { '/x': { get: { responses: {}, 'x-ostrom-status': 'served' } } },
      },
      TEST_API_URL,
    )
    const { container } = render(<ApiOverview api={bare} messages={en} />)
    expect(screen.queryByText(labels.servers)).toBeNull()
    expect(container.querySelectorAll('.docs-code')).toHaveLength(1)
  })

  it('list the operations of a tag, and every schema', () => {
    const { rerender } = render(<ApiTagPage tag={gates} messages={en} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Gates' })).toBeInTheDocument()
    expect(screen.getByText('Ask for a yes.')).toBeInTheDocument()
    expect(tagDescription(other, en)).toBe('The Other endpoints of the Ostrom API.')
    rerender(<ApiSchemasPage api={api} messages={en} />)
    expect(screen.getByRole('heading', { level: 2, name: 'GateRequest' })).toHaveAttribute(
      'id',
      'schema-gaterequest',
    )
  })
})
