import type { JsonSchema, JsonValue } from './document'

/** A schema ready to show: `$ref` resolved, `null` folded into `nullable`, cycles and depth cut into links. */
export type SchemaNode = SchemaCommon & SchemaShape

export interface SchemaCommon {
  /** The component name, when the schema came from `#/components/schemas/<name>`. */
  readonly name: string | null
  readonly description: string | null
  readonly nullable: boolean
}

export type SchemaShape =
  | {
      readonly kind: 'object'
      readonly properties: readonly PropertyNode[]
      readonly additional: SchemaNode | null
    }
  | { readonly kind: 'array'; readonly items: SchemaNode }
  | {
      readonly kind: 'scalar'
      readonly type: string
      readonly format: string | null
      readonly values: readonly string[]
      readonly defaultValue: string | null
    }
  | { readonly kind: 'union'; readonly options: readonly SchemaNode[] }
  /** A named schema not expanded here (too deep, or a cycle): the page links to its entry on the Schemas page. */
  | { readonly kind: 'link'; readonly target: string }

export interface PropertyNode {
  readonly name: string
  readonly required: boolean
  readonly deprecated: boolean
  readonly schema: SchemaNode
}

export interface SchemaContext {
  readonly schemas: Readonly<Record<string, JsonSchema>>
  /** How many levels of named schemas are expanded inline before they become links. */
  readonly maxDepth: number
}

/** The component name a `$ref` points at; anything but a local schema reference fails the build. */
export function refTarget(ref: string, kind: string): string {
  const prefix = `#/components/${kind}/`
  if (!ref.startsWith(prefix)) throw new Error(`unsupported $ref "${ref}": only ${prefix}<name> is rendered`)
  return ref.slice(prefix.length)
}

export function lookup<T>(table: Readonly<Record<string, T>> | undefined, ref: string, kind: string): T {
  const name = refTarget(ref, kind)
  const target = table?.[name]
  if (target === undefined) throw new Error(`$ref "${ref}" points at nothing`)
  return target
}

/** The JSON text of a value, to show an enum value or a default in the page. */
export function valueText(value: JsonValue): string {
  return typeof value === 'string' ? value : JSON.stringify(value)
}

function typesOf(schema: JsonSchema): readonly string[] {
  if (schema.type === undefined) return []
  return typeof schema.type === 'string' ? [schema.type] : schema.type
}

/** `{type: 'null'}`, the other half of a `oneOf: [X, null]`. */
export function isNullSchema(schema: JsonSchema): boolean {
  const types = typesOf(schema)
  return types.length === 1 && types[0] === 'null'
}

function common(schema: JsonSchema, nullable: boolean): SchemaCommon {
  return { name: null, description: schema.description ?? null, nullable }
}

function mergeObjects(parts: readonly SchemaNode[], base: SchemaCommon): SchemaNode {
  const properties: PropertyNode[] = []
  for (const part of parts) if (part.kind === 'object') properties.push(...part.properties)
  return { ...base, kind: 'object', properties, additional: null }
}

/** Resolves a schema for display. `depth` counts the named schemas already expanded above this one. */
export function resolveSchema(
  schema: JsonSchema,
  context: SchemaContext,
  depth = 0,
  seen: readonly string[] = [],
): SchemaNode {
  if (schema.$ref !== undefined) {
    const name = refTarget(schema.$ref, 'schemas')
    const target = lookup(context.schemas, schema.$ref, 'schemas')
    const description = schema.description ?? target.description ?? null
    if (seen.includes(name) || depth >= context.maxDepth)
      return { name, description, nullable: false, kind: 'link', target: name }
    return { ...resolveSchema(target, context, depth + 1, [...seen, name]), name, description }
  }

  const types = typesOf(schema)
  const nullable = types.includes('null')
  const variants = schema.oneOf ?? schema.anyOf
  if (variants !== undefined) {
    const options = variants.filter((variant) => !isNullSchema(variant))
    const optional = nullable || options.length < variants.length
    const [only] = options
    if (options.length === 1 && only !== undefined) {
      return {
        ...resolveSchema(only, context, depth, seen),
        nullable: optional,
        description: schema.description ?? null,
      }
    }
    return {
      ...common(schema, optional),
      kind: 'union',
      options: options.map((option) => resolveSchema(option, context, depth, seen)),
    }
  }
  if (schema.allOf !== undefined) {
    return mergeObjects(
      schema.allOf.map((part) => resolveSchema(part, context, depth, seen)),
      common(schema, nullable),
    )
  }

  const kinds = types.filter((type) => type !== 'null')
  if (kinds.includes('object') || schema.properties !== undefined) {
    const required = schema.required ?? []
    const additional = schema.additionalProperties
    return {
      ...common(schema, nullable),
      kind: 'object',
      properties: Object.entries(schema.properties ?? {}).map(([name, property]) => ({
        name,
        required: required.includes(name),
        deprecated: property.deprecated === true,
        schema: resolveSchema(property, context, depth, seen),
      })),
      additional:
        typeof additional === 'object'
          ? resolveSchema(additional, context, depth, seen)
          : additional === true
            ? anyValue()
            : null,
    }
  }
  if (kinds.includes('array') || schema.items !== undefined) {
    return {
      ...common(schema, nullable),
      kind: 'array',
      items: schema.items === undefined ? anyValue() : resolveSchema(schema.items, context, depth, seen),
    }
  }
  return {
    ...common(schema, nullable),
    kind: 'scalar',
    type: kinds.length > 0 ? kinds.join(' | ') : 'any',
    format: schema.format ?? schema.contentEncoding ?? null,
    values: (schema.enum ?? (schema.const === undefined ? [] : [schema.const])).map(valueText),
    defaultValue: schema.default === undefined ? null : valueText(schema.default),
  }
}

function anyValue(): SchemaNode {
  return {
    name: null,
    description: null,
    nullable: false,
    kind: 'scalar',
    type: 'any',
    format: null,
    values: [],
    defaultValue: null,
  }
}

/** The short type of a schema, as the reference prints it next to a field name. */
export function typeLabel(node: SchemaNode): string {
  switch (node.kind) {
    case 'object':
      return (
        node.name ??
        (node.properties.length === 0 && node.additional !== null
          ? `map of ${typeLabel(node.additional)}`
          : 'object')
      )
    case 'array':
      return `array of ${typeLabel(node.items)}`
    case 'scalar':
      return node.format === null ? node.type : `${node.type} (${node.format})`
    case 'union':
      return node.options.map(typeLabel).join(' or ')
    case 'link':
      return node.target
  }
}

/** The properties a node shows below its line: an object's own, or those of the objects in an array. */
export function childProperties(node: SchemaNode): readonly PropertyNode[] {
  if (node.kind === 'object') return node.properties
  if (node.kind === 'array') return childProperties(node.items)
  return []
}
