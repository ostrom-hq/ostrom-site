// SPDX-License-Identifier: Apache-2.0
import { parse as parseYaml } from 'yaml'
import { z } from '@/lib/zod'

// The part of OpenAPI 3.1 the reference renders, parsed with Zod: every value used by the pages has a known type, and
// a key we do not render is dropped by the parse instead of travelling as `unknown`.

export type JsonValue =
  string | number | boolean | null | readonly JsonValue[] | { readonly [key: string]: JsonValue }

const jsonValue: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValue),
    z.record(z.string(), jsonValue),
  ]),
)

/** A JSON Schema (2020-12, as OpenAPI 3.1 uses it), reduced to what the reference shows. */
export interface JsonSchema {
  readonly $ref?: string | undefined
  readonly type?: string | readonly string[] | undefined
  readonly title?: string | undefined
  readonly description?: string | undefined
  readonly format?: string | undefined
  readonly contentEncoding?: string | undefined
  readonly properties?: Readonly<Record<string, JsonSchema>> | undefined
  readonly required?: readonly string[] | undefined
  readonly items?: JsonSchema | undefined
  readonly additionalProperties?: boolean | JsonSchema | undefined
  readonly enum?: readonly JsonValue[] | undefined
  readonly const?: JsonValue | undefined
  readonly default?: JsonValue | undefined
  readonly examples?: readonly JsonValue[] | undefined
  readonly oneOf?: readonly JsonSchema[] | undefined
  readonly anyOf?: readonly JsonSchema[] | undefined
  readonly allOf?: readonly JsonSchema[] | undefined
  readonly deprecated?: boolean | undefined
}

export const jsonSchema: z.ZodType<JsonSchema> = z.lazy(() =>
  z.object({
    $ref: z.string().optional(),
    type: z.union([z.string(), z.array(z.string())]).optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    format: z.string().optional(),
    contentEncoding: z.string().optional(),
    properties: z.record(z.string(), jsonSchema).optional(),
    required: z.array(z.string()).optional(),
    items: jsonSchema.optional(),
    additionalProperties: z.union([z.boolean(), jsonSchema]).optional(),
    enum: z.array(jsonValue).optional(),
    const: jsonValue.optional(),
    default: jsonValue.optional(),
    examples: z.array(jsonValue).optional(),
    oneOf: z.array(jsonSchema).optional(),
    anyOf: z.array(jsonSchema).optional(),
    allOf: z.array(jsonSchema).optional(),
    deprecated: z.boolean().optional(),
  }),
)

const reference = z.object({ $ref: z.string() })

const mediaType = z.object({ schema: jsonSchema.optional() })
const content = z.record(z.string(), mediaType)

const parameter = z.object({
  name: z.string(),
  in: z.enum(['path', 'query', 'header', 'cookie']),
  description: z.string().optional(),
  required: z.boolean().optional(),
  deprecated: z.boolean().optional(),
  schema: jsonSchema.optional(),
})

const response = z.object({ description: z.string().optional(), content: content.optional() })

const requestBody = z.object({
  description: z.string().optional(),
  required: z.boolean().optional(),
  content,
})

const securityRequirement = z.record(z.string(), z.array(z.string()))

const operation = z.object({
  operationId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
  deprecated: z.boolean().optional(),
  parameters: z.array(z.union([reference, parameter])).optional(),
  requestBody: z.union([reference, requestBody]).optional(),
  responses: z.record(z.string(), z.union([reference, response])),
  security: z.array(securityRequirement).optional(),
  /** Set by the server's pull request that serves the route; the public reference lists only those (see reference.ts). */
  'x-ostrom-server': z.string().optional(),
  'x-ostrom-status': z.string().optional(),
})

export const httpMethods = ['get', 'put', 'post', 'delete', 'patch', 'head', 'options'] as const
export type HttpMethod = (typeof httpMethods)[number]

const pathItem = z.object({
  summary: z.string().optional(),
  description: z.string().optional(),
  parameters: z.array(z.union([reference, parameter])).optional(),
  get: operation.optional(),
  put: operation.optional(),
  post: operation.optional(),
  delete: operation.optional(),
  patch: operation.optional(),
  head: operation.optional(),
  options: operation.optional(),
})

const serverVariable = z.object({
  default: z.string(),
  description: z.string().optional(),
  enum: z.array(z.string()).optional(),
})

const securityScheme = z.object({
  type: z.string(),
  description: z.string().optional(),
  scheme: z.string().optional(),
  bearerFormat: z.string().optional(),
  name: z.string().optional(),
  in: z.string().optional(),
})

export const openApiDocument = z.object({
  openapi: z.string().regex(/^3\.1\.\d+$/, 'only OpenAPI 3.1 is supported'),
  info: z.object({ title: z.string(), version: z.string(), description: z.string().optional() }),
  servers: z
    .array(
      z.object({
        url: z.string(),
        description: z.string().optional(),
        variables: z.record(z.string(), serverVariable).optional(),
      }),
    )
    .optional(),
  security: z.array(securityRequirement).optional(),
  tags: z.array(z.object({ name: z.string(), description: z.string().optional() })).optional(),
  paths: z.record(z.string(), pathItem),
  components: z
    .object({
      schemas: z.record(z.string(), jsonSchema).optional(),
      responses: z.record(z.string(), response).optional(),
      parameters: z.record(z.string(), parameter).optional(),
      requestBodies: z.record(z.string(), requestBody).optional(),
      securitySchemes: z.record(z.string(), securityScheme).optional(),
    })
    .optional(),
})

export type OpenApiDocument = z.infer<typeof openApiDocument>
export type Operation = z.infer<typeof operation>
export type Parameter = z.infer<typeof parameter>
export type Response = z.infer<typeof response>
export type RequestBody = z.infer<typeof requestBody>
export type Reference = z.infer<typeof reference>
export type MediaTypes = z.infer<typeof content>

/** Parses the YAML text of an OpenAPI description; a shape we cannot render fails the build with the path of the key. */
export function parseOpenApi(text: string): OpenApiDocument {
  const parsed = openApiDocument.safeParse(parseYaml(text))
  if (!parsed.success)
    throw new Error(
      `api/openapi.yaml is not a description the reference can render:\n${z.prettifyError(parsed.error)}`,
    )
  return parsed.data
}
