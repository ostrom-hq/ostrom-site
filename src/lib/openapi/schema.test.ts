// SPDX-License-Identifier: Apache-2.0
import type { JsonSchema } from './document'
import {
  childProperties,
  isNullSchema,
  lookup,
  refTarget,
  resolveSchema,
  typeLabel,
  valueText,
  type SchemaContext,
  type SchemaNode,
} from './schema'

const schemas: Record<string, JsonSchema> = {
  Node: {
    type: 'object',
    description: 'A tree node',
    properties: { children: { type: 'array', items: { $ref: '#/components/schemas/Node' } } },
  },
  Mode: { type: 'string', enum: ['a', 'b'] },
  Plain: { type: 'string' },
  Deep: { type: 'object', properties: { mode: { $ref: '#/components/schemas/Mode' } } },
}
const context: SchemaContext = { schemas, maxDepth: 2 }
const resolve = (schema: JsonSchema): SchemaNode => resolveSchema(schema, context)

describe('references', () => {
  it('reads local references and refuses anything else', () => {
    expect(refTarget('#/components/schemas/Node', 'schemas')).toBe('Node')
    expect(() => refTarget('other.yaml#/Node', 'schemas')).toThrow('unsupported $ref')
    expect(lookup(schemas, '#/components/schemas/Mode', 'schemas')).toBe(schemas['Mode'])
    expect(() => lookup(schemas, '#/components/schemas/Ghost', 'schemas')).toThrow('points at nothing')
    expect(() => lookup(undefined, '#/components/schemas/Ghost', 'schemas')).toThrow('points at nothing')
  })
})

describe('resolveSchema', () => {
  it('expands a named schema, keeps its name and description, and cuts a cycle into a link', () => {
    const node = resolve({ $ref: '#/components/schemas/Node' })
    expect(node).toMatchObject({ kind: 'object', name: 'Node', description: 'A tree node' })
    const children = childProperties(node)[0]?.schema
    expect(children?.kind).toBe('array')
    expect(children?.kind === 'array' && children.items).toMatchObject({ kind: 'link', target: 'Node' })
  })

  it('stops expanding at the depth limit', () => {
    const shallow = resolveSchema({ $ref: '#/components/schemas/Deep' }, { schemas, maxDepth: 1 })
    expect(childProperties(shallow)[0]?.schema).toMatchObject({
      kind: 'link',
      target: 'Mode',
      description: null,
    })
  })

  it('prefers the description written where a reference is used', () => {
    expect(resolve({ $ref: '#/components/schemas/Mode', description: 'Here' }).description).toBe('Here')
    expect(resolve({ $ref: '#/components/schemas/Plain' }).description).toBeNull()
  })

  it('folds null into nullable, from a type list or a oneOf', () => {
    expect(resolve({ type: ['string', 'null'] })).toMatchObject({
      kind: 'scalar',
      type: 'string',
      nullable: true,
    })
    expect(resolve({ oneOf: [{ $ref: '#/components/schemas/Mode' }, { type: 'null' }] })).toMatchObject({
      name: 'Mode',
      nullable: true,
      description: null,
    })
    expect(resolve({ anyOf: [{ type: 'string' }, { type: 'integer' }] })).toMatchObject({
      kind: 'union',
      nullable: false,
    })
    expect(resolve({ type: ['null'], oneOf: [{ type: 'string' }] })).toMatchObject({
      kind: 'scalar',
      nullable: true,
    })
  })

  it('merges the objects of an allOf', () => {
    const node = resolve({
      allOf: [{ type: 'object', properties: { a: { type: 'string' } } }, { type: 'string' }],
    })
    expect(childProperties(node).map((property) => property.name)).toEqual(['a'])
  })

  it('describes objects: required and deprecated fields, maps and free-form values', () => {
    const node = resolve({
      type: 'object',
      properties: { a: { type: 'string' }, b: { type: 'boolean', deprecated: true } },
      required: ['a'],
      additionalProperties: { type: 'integer' },
    })
    expect(node.kind === 'object' && node.properties.map((p) => [p.name, p.required, p.deprecated])).toEqual([
      ['a', true, false],
      ['b', false, true],
    ])
    expect(node.kind === 'object' && node.additional).toMatchObject({ kind: 'scalar', type: 'integer' })
    expect(resolve({ type: 'object', additionalProperties: true })).toMatchObject({
      kind: 'object',
      properties: [],
      additional: { type: 'any' },
    })
    expect(resolve({ type: 'object', additionalProperties: false })).toMatchObject({ additional: null })
  })

  it('describes arrays, with or without items', () => {
    expect(resolve({ type: 'array' })).toMatchObject({ kind: 'array', items: { type: 'any' } })
    expect(resolve({ items: { type: 'string' } })).toMatchObject({ kind: 'array', items: { type: 'string' } })
  })

  it('describes scalars: format, encoding, values and default', () => {
    expect(resolve({ type: 'string', format: 'date-time' })).toMatchObject({ format: 'date-time' })
    expect(resolve({ type: 'string', contentEncoding: 'binary' })).toMatchObject({ format: 'binary' })
    expect(resolve({ type: 'string', enum: ['x', 1] })).toMatchObject({ values: ['x', '1'] })
    expect(resolve({ const: 'only' })).toMatchObject({ type: 'any', values: ['only'] })
    expect(resolve({ type: 'integer', default: 3 })).toMatchObject({ defaultValue: '3', values: [] })
    expect(resolve({})).toMatchObject({ type: 'any', format: null, defaultValue: null })
  })
})

describe('labels', () => {
  it('names a type the way the reference prints it', () => {
    expect(typeLabel(resolve({ $ref: '#/components/schemas/Node' }))).toBe('Node')
    expect(typeLabel(resolve({ type: 'object' }))).toBe('object')
    expect(typeLabel(resolve({ type: 'object', additionalProperties: { type: 'string' } }))).toBe(
      'map of string',
    )
    expect(typeLabel(resolve({ type: 'array', items: { type: 'string' } }))).toBe('array of string')
    expect(typeLabel(resolve({ type: 'string', format: 'uri' }))).toBe('string (uri)')
    expect(typeLabel(resolve({ oneOf: [{ type: 'string' }, { type: 'integer' }] }))).toBe('string or integer')
    expect(typeLabel(resolveSchema({ $ref: '#/components/schemas/Mode' }, { schemas, maxDepth: 0 }))).toBe(
      'Mode',
    )
  })

  it('shows values as text', () => {
    expect(valueText('a')).toBe('a')
    expect(valueText({ a: [1, null] })).toBe('{"a":[1,null]}')
  })

  it('knows a null schema', () => {
    expect(isNullSchema({ type: 'null' })).toBe(true)
    expect(isNullSchema({ type: ['string', 'null'] })).toBe(false)
    expect(isNullSchema({})).toBe(false)
  })

  it('finds the fields of an object, of an array of objects, and none for a scalar', () => {
    expect(
      childProperties(resolve({ type: 'array', items: { type: 'object', properties: { a: {} } } })),
    ).toHaveLength(1)
    expect(childProperties(resolve({ type: 'string' }))).toEqual([])
  })
})
