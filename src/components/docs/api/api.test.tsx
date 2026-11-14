// SPDX-License-Identifier: Apache-2.0
import { cleanup, render, screen, within } from '@testing-library/react'
import { en } from '@/i18n/en'
import { buildApiReference, type ApiOperation, type ApiReference } from '@/lib/openapi/reference'
import { TEST_API_URL, fixtureSite, linkTarget } from '@/test/docs'
import {
  ApiMore,
  ApiOverview,
  ApiSchemasIndex,
  ApiSchemasPage,
  ApiTagPage,
  MethodBadge,
  OperationSummary,
  overviewToc,
  tagDescription,
} from './ApiPages'
import { InlineText, splitSummary } from './InlineText'

const labels = en.docs.api
const api = fixtureSite().api
if (api === null) throw new Error('the fixture has an API description')
const [gates, other] = api.tags
if (gates === undefined || other === undefined) throw new Error('the fixture has two tags')

function operation(anchor: string): ApiOperation {
  const found = api?.tags.flatMap((tag) => tag.operations).find((candidate) => candidate.anchor === anchor)
  if (found === undefined) throw new Error(`no operation ${anchor}`)
  return found
}

function oddSchema(from: ApiReference): ApiReference['schemas'][number] {
  const first = from.schemas[0]
  if (first === undefined) throw new Error('the fixture has schemas')
  return first
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

describe('an operation on its tag page', () => {
  it('shows the route and what it does, and its details behind a toggle that loads them', () => {
    render(<OperationSummary operation={operation('requestgate')} src="/data.json" labels={labels} />)
    const section = screen.getByRole('region', { name: 'Request a gate' })
    expect(within(section).getByText('POST', { selector: '.api-method' })).toHaveClass('api-method--post')
    expect(within(section).getByText('The agent waits for the', { exact: false })).toBeInTheDocument()
    expect(within(section).queryByText(labels.public)).toBeNull()
    // Nothing of the details is in the page: they load when the toggle opens.
    expect(within(section).queryByText('Seconds to wait')).toBeNull()
    const details = within(section).getByText(labels.details).closest('details')
    expect(details).toHaveAttribute('data-api-data', '/data.json')
    expect(details).toHaveAttribute('data-api-key', 'requestgate')
    // a closed toggle is only its summary: its body is added when it opens
    expect(details?.querySelector('[data-api-body]')).toBeNull()
  })

  it('marks a public or deprecated endpoint', () => {
    render(<OperationSummary operation={operation('get-apiv1gates')} src="/data.json" labels={labels} />)
    expect(screen.getByText(labels.public)).toBeInTheDocument()
    expect(screen.getByText(labels.deprecated)).toHaveClass('badge--warning')
  })

  it('colours the method', () => {
    render(<MethodBadge method="delete" />)
    expect(screen.getByText('DELETE')).toHaveClass('api-method--delete')
  })

  it('names the toggle', () => {
    render(<ApiMore src="/x.json" id="y" summary="More" />)
    expect(screen.getByText('More').closest('details')).toHaveClass('api-more')
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

  it('give the overview in the site words: base URL, authentication, errors and resources', () => {
    const { container } = render(<ApiOverview api={api} messages={en} />)
    expect(screen.getByText('Version 9.9.9')).toBeInTheDocument()
    expect(screen.getByText(labels.intro)).toBeInTheDocument()
    for (const item of overviewToc(labels))
      expect(screen.getByRole('heading', { name: item.text })).toHaveAttribute('id', item.id)
    // Neither the contract's description, its servers, nor its scheme descriptions are shown.
    expect(container).not.toHaveTextContent('fixture')
    expect(container).not.toHaveTextContent('localhost')
    expect(container).not.toHaveTextContent('An Ostrom token')
    expect(screen.getByText('bearer', { selector: 'code' }).parentElement).toHaveTextContent('bearer · http bearer')
    expect(labels.baseUrlBody).toContain('coming soon')
    expect(screen.getByText('400')).toHaveClass('api-status--4xx')
    // The error body's fields are on the overview itself.
    expect(screen.getByText('The body of every refusal')).toBeInTheDocument()
    expect(screen.getByText('error', { selector: 'code' })).toBeInTheDocument()
    expect(linkTarget(screen.getByRole('link', { name: 'Approvals' }))).toBe(linkTarget('/docs/api/approvals/'))
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
    expect(container.querySelectorAll('.docs-code')).toHaveLength(1)
  })

  it('list the operations of a tag, with the tag data file', () => {
    render(<ApiTagPage tag={gates} messages={en} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Approvals' })).toBeInTheDocument()
    expect(screen.getByText('Ask for a yes.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Request a gate' })).toBeInTheDocument()
    for (const details of document.querySelectorAll('details[data-api-data]'))
      expect(details).toHaveAttribute('data-api-data', '/docs/api-data/approvals.json')
    expect(tagDescription(other, en)).toBe('The Other endpoints of the Ostrom API.')
  })

  it('list every schema by name, its fields behind a toggle when it has any', () => {
    const bare: ApiReference = {
      ...api,
      schemas: [
        ...api.schemas,
        {
          name: 'GateBare',
          anchor: 'schema-gatebare',
          node: {
            name: 'GateBare',
            description: null,
            nullable: false,
            kind: 'scalar',
            type: 'string',
            format: null,
            values: [],
            defaultValue: null,
          },
        },
      ],
    }
    render(<ApiSchemasPage api={bare} group="g" messages={en} />)
    cleanup()
    render(<ApiSchemasPage api={{ ...bare, schemas: [{ ...oddSchema(bare), name: '_x', anchor: 'schema-x' }] }} group="other" messages={en} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Schemas: Other' })).toBeInTheDocument()
    cleanup()
    render(<ApiSchemasPage api={bare} group="g" messages={en} />)
    expect(screen.queryByRole('heading', { level: 2, name: 'Node' })).toBeNull()
    expect(screen.getByRole('heading', { level: 2, name: 'GateRequest' })).toHaveAttribute(
      'id',
      'schema-gaterequest',
    )
    const status = screen.getByRole('region', { name: 'GateStatus' })
    expect(within(status).getByText('Where the gate stands')).toBeInTheDocument()
    expect(within(status).getByText(labels.schemaDetails).closest('details')).toHaveAttribute(
      'data-api-data',
      '/docs/api-data/schemas-g.json',
    )
    expect(within(screen.getByRole('region', { name: 'GateBare' })).queryByText(labels.schemaDetails)).toBeNull()
  })

  it('index the schemas by initial, with how many each page holds', () => {
    const odd: ApiReference = { ...api, schemas: [...api.schemas, { ...oddSchema(api), name: '_x', anchor: 'schema-x' }] }
    render(<ApiSchemasIndex api={odd} messages={en} />)
    expect(screen.getByRole('link', { name: 'G' })).toHaveAttribute('href', '/docs/api/schemas/g/')
    expect(screen.getByRole('link', { name: en.docs.api.schemasOther })).toHaveAttribute(
      'href',
      '/docs/api/schemas/other/',
    )
  })
})
