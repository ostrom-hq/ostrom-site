// SPDX-License-Identifier: Apache-2.0
import type { JsonSchema } from './document'
import { curlCommand, EXAMPLE_DEPTH, exampleValue } from './example'

const schemas: Record<string, JsonSchema> = {
  Node: {
    type: 'object',
    properties: { name: { type: 'string' }, next: { $ref: '#/components/schemas/Node' } },
  },
}

describe('exampleValue', () => {
  it('takes the example, default, const or first enum value the contract gives', () => {
    expect(exampleValue({ type: 'string', examples: ['given'], default: 'no' }, schemas)).toBe('given')
    expect(exampleValue({ type: 'integer', default: 7 }, schemas)).toBe(7)
    expect(exampleValue({ const: 'fixed' }, schemas)).toBe('fixed')
    expect(exampleValue({ type: 'string', enum: ['first', 'second'] }, schemas)).toBe('first')
  })

  it('writes a placeholder of the right type', () => {
    expect(exampleValue({ type: 'string' }, schemas)).toBe('string')
    expect(exampleValue({ type: 'string', format: 'date-time' }, schemas)).toBe('2026-10-30T12:00:00Z')
    expect(exampleValue({ type: 'integer' }, schemas)).toBe(0)
    expect(exampleValue({ type: 'number' }, schemas)).toBe(0)
    expect(exampleValue({ type: 'boolean' }, schemas)).toBe(true)
    expect(exampleValue({ type: ['null', 'string'] }, schemas)).toBe('string')
    expect(exampleValue({}, schemas)).toBeNull()
    expect(exampleValue({ type: 'null' }, schemas)).toBeNull()
  })

  it('follows references and stops on a cycle', () => {
    expect(exampleValue({ $ref: '#/components/schemas/Node' }, schemas)).toEqual({ name: 'string', next: {} })
  })

  it('builds objects and arrays, and stops nesting at the depth limit', () => {
    expect(exampleValue({ properties: { a: { items: { type: 'integer' } } } }, schemas)).toEqual({ a: [0] })
    expect(exampleValue({ type: 'array' }, schemas)).toEqual([])
    expect(exampleValue({ type: 'object' }, schemas)).toEqual({})
    expect(
      exampleValue({ type: 'object', properties: { a: { type: 'string' } } }, schemas, EXAMPLE_DEPTH),
    ).toEqual({})
    expect(exampleValue({ type: 'array', items: { type: 'string' } }, schemas, EXAMPLE_DEPTH)).toEqual([])
  })

  it('takes the first non-null option of a union and merges an allOf', () => {
    expect(exampleValue({ oneOf: [{ type: 'null' }, { type: 'integer' }] }, schemas)).toBe(0)
    expect(exampleValue({ anyOf: [{ type: 'null' }] }, schemas)).toBeNull()
    expect(
      exampleValue(
        {
          allOf: [
            { properties: { a: { type: 'boolean' } } },
            { type: 'string' },
            { properties: { b: { type: 'integer' } } },
          ],
        },
        schemas,
      ),
    ).toEqual({ a: true, b: 0 })
  })
})

describe('curlCommand', () => {
  it('writes a GET without a method flag', () => {
    expect(
      curlCommand({
        method: 'get',
        url: 'https://api.test/a',
        authenticated: false,
        headers: [],
        body: null,
      }),
    ).toBe('curl "https://api.test/a"')
  })

  it('writes the token, the headers and a JSON body, quoted for the shell', () => {
    expect(
      curlCommand({
        method: 'post',
        url: 'https://api.test/a',
        authenticated: true,
        headers: [['X-Org', 'acme']],
        body: { contentType: 'application/json', example: { name: "it's" } },
      }),
    ).toBe(
      [
        'curl -X POST "https://api.test/a"',
        '-H "Authorization: Bearer $OSTROM_TOKEN"',
        '-H "X-Org: acme"',
        '-H "Content-Type: application/json"',
        `-d '{\n  "name": "it'\\''s"\n}'`,
      ].join(' \\\n  '),
    )
  })

  it('sends a file for a body that is not JSON', () => {
    expect(
      curlCommand({
        method: 'put',
        url: 'https://api.test/f',
        authenticated: false,
        headers: [],
        body: { contentType: 'application/octet-stream', example: {} },
      }),
    ).toContain('--data-binary @file')
  })
})
