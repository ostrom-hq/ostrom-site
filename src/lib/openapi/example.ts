import type { JsonSchema, JsonValue } from './document'
import { isNullSchema, lookup } from './schema'

/** How deep an example nests objects before it writes `{}`: enough to show the shape, never a wall of JSON. */
export const EXAMPLE_DEPTH = 4

const SAMPLE_BY_FORMAT: Readonly<Record<string, string>> = {
  'date-time': '2026-10-30T12:00:00Z',
  date: '2026-10-30',
  uri: 'https://example.com',
  email: 'ada@example.com',
  uuid: '00000000-0000-4000-8000-000000000000',
}

function scalarExample(type: string, format: string | undefined): JsonValue {
  switch (type) {
    case 'integer':
    case 'number':
      return 0
    case 'boolean':
      return true
    case 'string':
      return SAMPLE_BY_FORMAT[format ?? ''] ?? 'string'
    default:
      return null
  }
}

/**
 * A plausible value for a schema, for the copyable examples: the first example, default, const or enum value when the
 * contract has one, else a placeholder of the right type. Named schemas already on the path end the recursion.
 */
export function exampleValue(
  schema: JsonSchema,
  schemas: Readonly<Record<string, JsonSchema>>,
  depth = 0,
  seen: readonly string[] = [],
): JsonValue {
  if (schema.$ref !== undefined) {
    if (seen.includes(schema.$ref)) return {}
    return exampleValue(lookup(schemas, schema.$ref, 'schemas'), schemas, depth, [...seen, schema.$ref])
  }
  const given = schema.examples?.[0] ?? schema.default ?? schema.const ?? schema.enum?.[0]
  if (given !== undefined) return given
  const variants = schema.oneOf ?? schema.anyOf
  if (variants !== undefined) {
    const [first] = variants.filter((variant) => !isNullSchema(variant))
    return first === undefined ? null : exampleValue(first, schemas, depth, seen)
  }
  if (schema.allOf !== undefined) {
    const merged: Record<string, JsonValue> = {}
    for (const part of schema.allOf) {
      const value = exampleValue(part, schemas, depth, seen)
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) Object.assign(merged, value)
    }
    return merged
  }
  const types = typeof schema.type === 'string' ? [schema.type] : (schema.type ?? [])
  const [type = schema.properties === undefined ? (schema.items === undefined ? 'any' : 'array') : 'object'] =
    types.filter((candidate) => candidate !== 'null')
  if (type === 'object') {
    if (depth >= EXAMPLE_DEPTH) return {}
    const value: Record<string, JsonValue> = {}
    for (const [name, property] of Object.entries(schema.properties ?? {})) {
      value[name] = exampleValue(property, schemas, depth + 1, seen)
    }
    return value
  }
  if (type === 'array') {
    return depth >= EXAMPLE_DEPTH || schema.items === undefined
      ? []
      : [exampleValue(schema.items, schemas, depth + 1, seen)]
  }
  return scalarExample(type, schema.format)
}

export interface CurlRequest {
  readonly method: string
  readonly url: string
  readonly authenticated: boolean
  readonly headers: readonly (readonly [string, string])[]
  readonly body: { readonly contentType: string; readonly example: JsonValue } | null
}

const shellQuote = (text: string): string => `'${text.replace(/'/g, `'\\''`)}'`

/** A curl command for one operation, one option per line, with the token taken from `$OSTROM_TOKEN`. */
export function curlCommand(request: CurlRequest): string {
  const method = request.method.toUpperCase()
  const parts = [`curl${method === 'GET' ? '' : ` -X ${method}`} "${request.url}"`]
  if (request.authenticated) parts.push('-H "Authorization: Bearer $OSTROM_TOKEN"')
  for (const [name, value] of request.headers) parts.push(`-H "${name}: ${value}"`)
  if (request.body !== null) {
    parts.push(`-H "Content-Type: ${request.body.contentType}"`)
    parts.push(
      request.body.contentType.endsWith('json')
        ? `-d ${shellQuote(JSON.stringify(request.body.example, null, 2))}`
        : '--data-binary @file',
    )
  }
  return parts.join(' \\\n  ')
}
