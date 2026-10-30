// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { FIXTURE_CONTENT, MISSING_CONTENT, TEST_API_URL } from '@/test/docs'
import { httpMethods, parseOpenApi } from './document'
import {
  buildApiReference,
  isServed,
  readApiReference,
  schemaAnchor,
  serverUrl,
  tagTitle,
  type ApiOperation,
} from './reference'

const file = join(FIXTURE_CONTENT, 'api', 'openapi.yaml')
const api = readApiReference(file, TEST_API_URL)

function operation(id: string): ApiOperation {
  const found = api?.tags.flatMap((tag) => tag.operations).find((candidate) => candidate.anchor === id)
  if (found === undefined) throw new Error(`no operation ${id}`)
  return found
}

describe('parseOpenApi', () => {
  it('refuses anything but OpenAPI 3.1', () => {
    expect(() => parseOpenApi('openapi: 3.0.3\ninfo: {title: a, version: "1"}\npaths: {}\n')).toThrow(
      'only OpenAPI 3.1',
    )
  })

  it('refuses a shape it cannot render', () => {
    expect(() => parseOpenApi('openapi: 3.1.0\ninfo: {title: a}\npaths: {}\n')).toThrow('info.version')
  })
})

describe('the reference of the fixture', () => {
  it('reads the description, the servers and the security schemes', () => {
    expect(api).toMatchObject({
      title: 'Fixture API',
      version: '9.9.9',
      description: 'The `fixture` contract. Read [the guides](/docs/) first.',
      baseUrl: TEST_API_URL,
    })
    expect(api?.servers).toEqual([
      { url: 'https://localhost:4317/base', description: 'Self-hosted' },
      { url: 'https://{unknown}.example', description: null },
    ])
    expect(api?.authentication).toEqual([
      { name: 'bearer', type: 'http', scheme: 'bearer', description: 'An Ostrom token' },
      { name: 'key', type: 'apiKey', scheme: null, description: null },
    ])
  })

  it('leaves out the operations the server does not serve yet, and the schemas only they use', () => {
    expect(api?.tags.some((tag) => tag.slug === 'secrets')).toBe(false)
    expect(api?.schemas.some((schema) => schema.name === 'Secret')).toBe(false)
  })

  it('groups operations by their first tag, declared tags first, untagged ones last', () => {
    expect(api?.tags.map((tag) => [tag.slug, tag.title, tag.description, tag.operations.length])).toEqual([
      ['gates', 'Gates', 'Ask for a yes.', 3],
      ['other', 'Other', null, 1],
    ])
  })

  it('merges path parameters with the operation ones, the operation winning', () => {
    const request = operation('requestgate')
    expect(
      request.parameters.map((parameter) => [parameter.location, parameter.name, parameter.required]),
    ).toEqual([
      ['header', 'org', true],
      ['query', 'wait', true],
      ['header', 'trace', false],
    ])
    expect(request.parameters[1]?.description).toBe('Seconds to wait')
  })

  it('resolves the request body, the responses and their references', () => {
    const request = operation('requestgate')
    expect(request.body).toMatchObject({
      contentType: 'application/json',
      required: true,
      description: 'What to ask for',
    })
    expect(request.body?.schema).toMatchObject({ kind: 'object', name: 'GateRequest' })
    expect(
      request.responses.map((response) => [response.status, response.description, response.contentType]),
    ).toEqual([
      ['201', 'Created', 'application/json'],
      ['400', 'A refusal', 'application/json'],
    ])
    expect(request.authenticated).toBe(true)
    expect(request.summary).toBe('Request a gate. The agent waits for the `yes`.')
  })

  it('writes a curl with the required query and header parameters and an example body', () => {
    const request = operation('requestgate')
    expect(request.curl).toContain('curl -X POST "https://api.example.test/api/v1/gates?wait=0"')
    expect(request.curl).toContain('-H "org: string"')
    expect(request.curl).toContain('"repo": "string"')
    expect(request.curl).toContain('"mode": "pending"')
    expect(request.responseExample?.status).toBe('201')
    expect(request.responseExample?.json).toContain('"status": "pending"')
  })

  it('handles an operation without id, summary, token or JSON', () => {
    const list = operation('get-apiv1gates')
    expect(list).toMatchObject({
      operationId: null,
      summary: 'GET /api/v1/gates',
      authenticated: false,
      deprecated: true,
    })
    expect(list.responses[1]).toEqual({
      status: '302',
      description: 'Redirect',
      contentType: null,
      schema: null,
    })
    expect(list.responseExample).toBeNull()
    expect(list.curl.startsWith('curl "')).toBe(true)
  })

  it('sends a file body and a header without schema', () => {
    const remove = operation('deletegate')
    expect(remove.body).toEqual({
      contentType: 'application/octet-stream',
      required: false,
      description: null,
      schema: null,
    })
    expect(remove.curl).toContain('-H "X-Raw: value"')
    expect(remove.curl).toContain('--data-binary @file')
    expect(remove.responses[0]).toMatchObject({ contentType: 'text/plain', schema: null })
  })

  it('drops a request body without content', () => {
    const health = operation('health')
    expect(health.body).toBeNull()
    expect(health.responses[0]?.description).toBeNull()
  })

  it('collects the status codes, the error body and every schema', () => {
    expect(api?.statuses).toEqual(['200', '201', '204', '302', '400'])
    expect(api?.error.description).toBe('A refusal')
    expect(api?.error.schema).toMatchObject({ name: 'ApiError' })
    expect(api?.error.example).toContain('"code": "string"')
    expect(api?.schemas.map((schema) => [schema.name, schema.anchor])).toEqual([
      ['ApiError', 'schema-apierror'],
      ['Gate', 'schema-gate'],
      ['GateRequest', 'schema-gaterequest'],
      ['GateStatus', 'schema-gatestatus'],
      ['Node', 'schema-node'],
    ])
    expect(api?.schemas[1]?.node).toMatchObject({ kind: 'object', name: 'Gate' })
  })
})

describe('a minimal description', () => {
  it('builds with nothing optional', () => {
    const minimal = buildApiReference(
      {
        openapi: '3.1.0',
        info: { title: 'Min', version: '0' },
        paths: { '/x': { get: { responses: {}, 'x-ostrom-status': 'served' } } },
      },
      TEST_API_URL,
    )
    expect(minimal).toMatchObject({
      description: null,
      servers: [],
      authentication: [],
      error: { description: null, schema: null, example: null },
      schemas: [],
    })
    expect(minimal.tags[0]?.operations[0]?.authenticated).toBe(false)
  })

  it('documents nothing while the server serves none of the contract', () => {
    const unserved = buildApiReference(
      {
        openapi: '3.1.0',
        info: { title: 'Min', version: '0' },
        paths: { '/x': { get: { responses: { '200': { $ref: '#/components/responses/Error' } } } } },
        components: {
          responses: {
            Error: { content: { 'application/json': { schema: { $ref: '#/components/schemas/E' } } } },
          },
          schemas: { E: {} },
        },
      },
      TEST_API_URL,
    )
    expect(unserved.tags).toEqual([])
    expect(unserved.schemas).toEqual([])
    expect(unserved.statuses).toEqual([])
  })

  it('is absent when the snapshot is not there', () => {
    expect(readApiReference(join(MISSING_CONTENT, 'openapi.yaml'), TEST_API_URL)).toBeNull()
  })
})

describe('names', () => {
  it('titles tags and anchors schemas', () => {
    expect(tagTitle('mcp')).toBe('MCP')
    expect(tagTitle('github')).toBe('GitHub')
    expect(tagTitle('push-devices')).toBe('Push devices')
    expect(schemaAnchor('ApiError')).toBe('schema-apierror')
    expect(serverUrl({ url: 'https://{a}' })).toBe('https://{a}')
  })

  it('parses the snapshot of the real contract, and lists only what the server serves', () => {
    const real = parseOpenApi(readFileSync(join(process.cwd(), 'content', 'api', 'openapi.yaml'), 'utf8'))
    expect(real.openapi).toMatch(/^3\.1\./)
    const served = Object.values(real.paths).flatMap((item) =>
      httpMethods.flatMap((method) => (item[method] === undefined ? [] : [item[method]])),
    )
    const reference = buildApiReference(real, TEST_API_URL)
    expect(reference.tags.flatMap((tag) => tag.operations)).toHaveLength(
      served.filter((operation) => isServed(operation)).length,
    )
  })
})
