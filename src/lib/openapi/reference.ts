import { existsSync, readFileSync } from 'node:fs'
import GithubSlugger from 'github-slugger'
import {
  httpMethods,
  parseOpenApi,
  type HttpMethod,
  type JsonSchema,
  type JsonValue,
  type MediaTypes,
  type OpenApiDocument,
  type Operation,
  type Parameter,
  type Reference,
  type RequestBody,
  type Response,
} from './document'
import { curlCommand, exampleValue } from './example'
import { lookup, refTarget, resolveSchema, type SchemaContext, type SchemaNode } from './schema'

// The API reference model: the OpenAPI description turned into tag pages of operations, every schema resolved. Built
// once at build time from content/api/openapi.yaml, the snapshot synced from ostrom-core by scripts/sync-openapi.ts.

export interface ApiParameter {
  readonly name: string
  readonly location: Parameter['in']
  readonly required: boolean
  readonly deprecated: boolean
  readonly description: string | null
  readonly schema: SchemaNode | null
}

export interface ApiBody {
  readonly contentType: string
  readonly required: boolean
  readonly description: string | null
  readonly schema: SchemaNode | null
}

export interface ApiResponse {
  readonly status: string
  readonly description: string | null
  readonly contentType: string | null
  readonly schema: SchemaNode | null
}

export interface ApiOperation {
  /** The anchor of the operation on its tag page. */
  readonly anchor: string
  readonly operationId: string | null
  readonly method: HttpMethod
  readonly path: string
  readonly summary: string
  readonly description: string | null
  readonly deprecated: boolean
  readonly authenticated: boolean
  readonly parameters: readonly ApiParameter[]
  readonly body: ApiBody | null
  readonly responses: readonly ApiResponse[]
  readonly curl: string
  /** The JSON example of the first successful response, when it has a JSON body. */
  readonly responseExample: { readonly status: string; readonly json: string } | null
}

export interface ApiTag {
  readonly name: string
  readonly slug: string
  readonly title: string
  readonly description: string | null
  readonly operations: readonly ApiOperation[]
}

export interface ApiSchema {
  readonly name: string
  readonly anchor: string
  readonly node: SchemaNode
}

export interface ApiAuthentication {
  readonly name: string
  readonly type: string
  readonly scheme: string | null
  readonly description: string | null
}

export interface ApiReference {
  readonly title: string
  readonly version: string
  readonly description: string | null
  readonly baseUrl: string
  readonly servers: readonly { readonly url: string; readonly description: string | null }[]
  readonly authentication: readonly ApiAuthentication[]
  readonly error: {
    readonly description: string | null
    readonly schema: SchemaNode | null
    readonly example: string | null
  }
  readonly statuses: readonly string[]
  readonly tags: readonly ApiTag[]
  readonly schemas: readonly ApiSchema[]
}

/** Inline, named schemas are expanded this many levels deep in an operation; deeper ones link to the Schemas page. */
export const OPERATION_SCHEMA_DEPTH = 2
const UNTAGGED = 'other'
const TAG_TITLES: Readonly<Record<string, string>> = { mcp: 'MCP', github: 'GitHub', api: 'API' }

/** The page title of a tag: `sessions` → `Sessions`, with the product names spelled right. */
export function tagTitle(name: string): string {
  return TAG_TITLES[name] ?? `${name.charAt(0).toUpperCase()}${name.slice(1)}`.replace(/[-_]+/g, ' ')
}

/** The anchor of a component schema on the Schemas page, which every link to that schema targets. */
export function schemaAnchor(name: string): string {
  return `schema-${new GithubSlugger().slug(name)}`
}

const isReference = (value: Reference | Parameter | RequestBody | Response): value is Reference =>
  '$ref' in value

type Server = NonNullable<OpenApiDocument['servers']>[number]

/** A server URL with its variables replaced by their defaults: `https://{host}` → `https://localhost:4317`. */
export function serverUrl(server: Server): string {
  return server.url.replace(
    /\{(\w+)\}/g,
    (placeholder: string, name: string) => server.variables?.[name]?.default ?? placeholder,
  )
}

interface Media {
  readonly type: string
  readonly schema: JsonSchema | null
}

function firstMedia(content: MediaTypes | undefined): Media | null {
  const [entry] = Object.entries(content ?? {})
  if (entry === undefined) return null
  const [type, media] = entry
  return { type, schema: media.schema ?? null }
}

/**
 * The contract describes routes before the server serves them. The public reference shows an operation only once the
 * server's pull request marks it served (`x-ostrom-server: implemented`, or `x-ostrom-status: served`): it never
 * documents an endpoint that answers 404 (decision of 30/10/2026, QUESTIONS [DOCS 04:20]).
 */
export function isServed(operation: Operation): boolean {
  return operation['x-ostrom-server'] === 'implemented' || operation['x-ostrom-status'] === 'served'
}

/** Every `$ref` string anywhere in a value of the description. */
function collectRefs(value: unknown, into: string[]): void {
  if (typeof value !== 'object' || value === null) return
  for (const [key, child] of Object.entries(value)) {
    if (key === '$ref' && typeof child === 'string') into.push(child)
    else collectRefs(child, into)
  }
}

/** The component schemas the served operations use, directly or through other components: the Schemas page lists only those. */
function reachableSchemas(
  components: NonNullable<OpenApiDocument['components']>,
  roots: readonly unknown[],
): Set<string> {
  const tables: Readonly<Record<string, Readonly<Record<string, unknown>> | undefined>> = {
    schemas: components.schemas,
    responses: components.responses,
    parameters: components.parameters,
    requestBodies: components.requestBodies,
  }
  const pending: string[] = []
  collectRefs(roots, pending)
  const seen = new Set<string>()
  for (let ref = pending.pop(); ref !== undefined; ref = pending.pop()) {
    if (seen.has(ref)) continue
    seen.add(ref)
    const kind = String(ref.split('/')[2])
    // A $ref of another kind, or to nothing, fails the build here, as it does where the reference is rendered.
    collectRefs(lookup(tables[kind], ref, kind), pending)
  }
  return new Set(
    [...seen]
      .filter((ref) => ref.startsWith('#/components/schemas/'))
      .map((ref) => refTarget(ref, 'schemas')),
  )
}

const isJson = (media: Media | null): media is Media & { readonly schema: JsonSchema } =>
  media?.type.endsWith('json') === true && media.schema !== null

interface Builder {
  readonly document: OpenApiDocument
  readonly baseUrl: string
  readonly components: NonNullable<OpenApiDocument['components']>
  readonly schemas: Readonly<Record<string, JsonSchema>>
  readonly context: SchemaContext
}

function schemaNode(builder: Builder, schema: JsonSchema | null): SchemaNode | null {
  return schema === null ? null : resolveSchema(schema, builder.context)
}

function example(builder: Builder, schema: JsonSchema): string {
  return JSON.stringify(exampleValue(schema, builder.schemas), null, 2)
}

function sample(builder: Builder, schema: JsonSchema | undefined): string {
  if (schema === undefined) return 'value'
  const value = exampleValue(schema, builder.schemas)
  return typeof value === 'string' ? value : JSON.stringify(value)
}

function parameterOf(builder: Builder, value: Reference | Parameter): Parameter {
  return isReference(value) ? lookup(builder.components.parameters, value.$ref, 'parameters') : value
}

function responseOf(builder: Builder, value: Reference | Response): Response {
  return isReference(value) ? lookup(builder.components.responses, value.$ref, 'responses') : value
}

function bodyOf(
  builder: Builder,
  value: Reference | RequestBody | undefined,
): { readonly api: ApiBody; readonly example: JsonValue } | null {
  if (value === undefined) return null
  const source = isReference(value)
    ? lookup(builder.components.requestBodies, value.$ref, 'requestBodies')
    : value
  const media = firstMedia(source.content)
  if (media === null) return null
  return {
    api: {
      contentType: media.type,
      required: source.required === true,
      description: source.description ?? null,
      schema: schemaNode(builder, media.schema),
    },
    example: media.schema === null ? {} : exampleValue(media.schema, builder.schemas),
  }
}

function buildOperation(
  builder: Builder,
  path: string,
  method: HttpMethod,
  operation: Operation,
  shared: readonly Parameter[],
  slugger: GithubSlugger,
): ApiOperation {
  const own = (operation.parameters ?? []).map((value) => parameterOf(builder, value))
  const parameters = [
    ...shared.filter(
      (parameter) => !own.some((mine) => mine.name === parameter.name && mine.in === parameter.in),
    ),
    ...own,
  ]
  const security = operation.security ?? builder.document.security ?? []
  const authenticated = security.some((requirement) => Object.keys(requirement).length > 0)
  const body = bodyOf(builder, operation.requestBody)

  const responses: ApiResponse[] = []
  let responseExample: ApiOperation['responseExample'] = null
  for (const [status, value] of Object.entries(operation.responses)) {
    const response = responseOf(builder, value)
    const media = firstMedia(response.content)
    responses.push({
      status,
      description: response.description ?? null,
      contentType: media === null ? null : media.type,
      schema: media === null ? null : schemaNode(builder, media.schema),
    })
    if (responseExample === null && status.startsWith('2') && isJson(media)) {
      responseExample = { status, json: example(builder, media.schema) }
    }
  }

  const required = (location: Parameter['in']): readonly Parameter[] =>
    parameters.filter((parameter) => parameter.in === location && parameter.required === true)
  const query = required('query').map(
    (parameter) => `${parameter.name}=${encodeURIComponent(sample(builder, parameter.schema))}`,
  )

  return {
    anchor: slugger.slug(operation.operationId ?? `${method} ${path}`),
    operationId: operation.operationId ?? null,
    method,
    path,
    summary: operation.summary ?? `${method.toUpperCase()} ${path}`,
    description: operation.description ?? null,
    deprecated: operation.deprecated === true,
    authenticated,
    parameters: parameters.map((parameter) => ({
      name: parameter.name,
      location: parameter.in,
      required: parameter.required === true,
      deprecated: parameter.deprecated === true,
      description: parameter.description ?? null,
      schema: schemaNode(builder, parameter.schema ?? null),
    })),
    body: body === null ? null : body.api,
    responses,
    curl: curlCommand({
      method,
      url: `${builder.baseUrl}${path}${query.length > 0 ? `?${query.join('&')}` : ''}`,
      authenticated,
      headers: required('header').map(
        (parameter) => [parameter.name, sample(builder, parameter.schema)] as const,
      ),
      body: body === null ? null : { contentType: body.api.contentType, example: body.example },
    }),
    responseExample,
  }
}

interface BuiltTags {
  readonly tags: readonly ApiTag[]
  readonly statuses: readonly string[]
  /** The served operations as written in the description, with their path's parameters, to find the schemas they use. */
  readonly roots: readonly unknown[]
}

function buildTags(builder: Builder): BuiltTags {
  const operations = new Map<string, ApiOperation[]>()
  const sluggers = new Map<string, GithubSlugger>()
  const statuses = new Set<string>()
  const roots: unknown[] = []
  for (const [path, item] of Object.entries(builder.document.paths)) {
    const shared = (item.parameters ?? []).map((value) => parameterOf(builder, value))
    for (const method of httpMethods) {
      const operation = item[method]
      if (operation === undefined || !isServed(operation)) continue
      roots.push(operation, item.parameters)
      const tag = operation.tags?.[0] ?? UNTAGGED
      const slugger = sluggers.get(tag) ?? new GithubSlugger()
      sluggers.set(tag, slugger)
      const built = buildOperation(builder, path, method, operation, shared, slugger)
      for (const response of built.responses) statuses.add(response.status)
      operations.set(tag, [...(operations.get(tag) ?? []), built])
    }
  }
  const declared = builder.document.tags ?? []
  const declaredNames = declared.map((tag) => tag.name)
  const names = [
    ...declaredNames,
    ...[...operations.keys()].filter((name) => !declaredNames.includes(name)).sort(),
  ]
  const descriptions = new Map(declared.map((tag) => [tag.name, tag.description ?? null]))
  const slugger = new GithubSlugger()
  const tags = names.flatMap((name): ApiTag[] => {
    const list = operations.get(name)
    if (list === undefined) return []
    return [
      {
        name,
        slug: slugger.slug(name),
        title: tagTitle(name),
        description: descriptions.get(name) ?? null,
        operations: list,
      },
    ]
  })
  return { tags, statuses: [...statuses].sort(), roots }
}

function buildReference(document: OpenApiDocument, baseUrl: string): ApiReference {
  const components = document.components ?? {}
  const schemas = components.schemas ?? {}
  const builder: Builder = {
    document,
    baseUrl,
    components,
    schemas,
    context: { schemas, maxDepth: OPERATION_SCHEMA_DEPTH },
  }
  const { tags, statuses, roots } = buildTags(builder)
  const errorResponse = components.responses?.['Error']
  const used = reachableSchemas(components, roots.length === 0 ? [] : [...roots, errorResponse])
  const errorSchema = firstMedia(errorResponse?.content)?.schema ?? null
  const flat: SchemaContext = { schemas, maxDepth: 1 }
  return {
    title: document.info.title,
    version: document.info.version,
    description: document.info.description ?? null,
    baseUrl,
    servers: (document.servers ?? []).map((server) => ({
      url: serverUrl(server),
      description: server.description ?? null,
    })),
    authentication: Object.entries(components.securitySchemes ?? {}).map(([name, scheme]) => ({
      name,
      type: scheme.type,
      scheme: scheme.scheme ?? null,
      description: scheme.description ?? null,
    })),
    error: {
      description: errorResponse?.description ?? null,
      schema: schemaNode(builder, errorSchema),
      example: errorSchema === null ? null : example(builder, errorSchema),
    },
    statuses,
    tags,
    schemas: Object.entries(schemas)
      .filter(([name]) => used.has(name))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, schema]) => ({
        name,
        anchor: schemaAnchor(name),
        node: { ...resolveSchema(schema, flat, 1), name },
      })),
  }
}

/** The reference of an OpenAPI description; `baseUrl` is the API the curl examples call (api.ostrom.run). */
export function buildApiReference(document: OpenApiDocument, baseUrl: string): ApiReference {
  return buildReference(document, baseUrl)
}

/** Whether the reference has anything to show: at least one operation the server serves. */
export function isPublished(api: ApiReference): boolean {
  return api.tags.length > 0
}

/** Reads and builds the reference, or null when the snapshot is not in the repository yet. */
export function readApiReference(file: string, baseUrl: string): ApiReference | null {
  return existsSync(file) ? buildApiReference(parseOpenApi(readFileSync(file, 'utf8')), baseUrl) : null
}
