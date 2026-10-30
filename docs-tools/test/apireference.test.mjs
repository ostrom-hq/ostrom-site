// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict"
import {readFileSync} from "node:fs"
import {join} from "node:path"
import {test} from "node:test"
import {cell, generateApiReference, typeOf} from "../src/apireference.mjs"
import {main} from "../src/cli.mjs"
import {lintPage} from "../src/lint.mjs"
import {tree} from "./helpers.mjs"

const SPEC = `
openapi: 3.1.0
info: {title: Ostrom API, version: 1.2.3}
servers: [{url: /api/v1}]
tags:
  - {name: gates, description: "Requests for a person's yes."}
  - {name: unused}
components:
  securitySchemes:
    bearerAuth: {type: http, scheme: bearer, description: "A device token."}
    apiKey: {type: apiKey, in: header, name: X-Key}
  parameters:
    GateId: {name: id, in: path, required: true, schema: {type: string, format: uuid}, description: "The gate's id."}
  responses:
    NotFound:
      description: Not found.
      content: {application/json: {schema: {$ref: '#/components/schemas/Error'}}}
  schemas:
    Gate:
      description: "A gate | with a pipe."
      required: [id]
      properties:
        id: {type: string, format: uuid}
        status: {enum: [pending, approved]}
        kind: {const: gate}
        tags: {type: array, items: {type: string}}
        owner: {oneOf: [{$ref: '#/components/schemas/Error'}, {type: "null"}]}
        both: {allOf: [{$ref: '#/components/schemas/Error'}]}
        count: {type: [integer, "null"], description: "Up to {n} <items>"}
        any: {anyOf: [{type: string}, {type: number}]}
    Error: {type: object, properties: {code: {type: string}}}
    Ids: {type: array, items: {type: string}}
paths:
  /gates/{id}:
    parameters: [{$ref: '#/components/parameters/GateId'}]
    get:
      x-ostrom-server: implemented
      tags: [gates]
      summary: One gate.
      description: |
        Waits up to
        30 seconds.
      parameters: [{name: wait, in: query, schema: {type: integer}}]
      responses:
        '200': {description: The gate., content: {application/json: {schema: {$ref: '#/components/schemas/Gate'}}}}
        '404': {$ref: '#/components/responses/NotFound'}
    post:
      x-ostrom-server: implemented
      tags: [extra]
      requestBody: {content: {text/plain: {schema: {type: string}}}}
      responses: {'204': {description: Done.}}
  /health:
    get:
      x-ostrom-server: implemented
      responses: {'200': {description: OK}}
    patch:
      x-ostrom-server: planned
      responses: {'200': {description: Planned}}
    delete:
      x-ostrom-server: implemented
      requestBody: {required: true, content: {application/json: {schema: {$ref: '#/components/schemas/Ids'}}}}
`

test("cell keeps tables and MDX intact", () => {
    assert.equal(cell("a | b\n  c <d> {e} & f"), "a \\| b c &lt;d> &#123;e&#125; &amp; f")
    assert.equal(cell(undefined), "")
})

test("typeOf names references, unions, enums, constants, arrays and formats", () => {
    assert.equal(typeOf(undefined), "")
    assert.equal(typeOf({$ref: "#/components/schemas/My_Gate"}), "[My_Gate](#my_gate)")
    assert.equal(typeOf({type: "array", items: {type: "string", format: "uuid"}}), "string (uuid) array")
    assert.equal(typeOf({type: "array"}), "object array")
    assert.equal(typeOf({enum: ["a", 1]}), '`"a"`, `1`')
    assert.equal(typeOf({const: false}), "`false`")
    assert.equal(typeOf({type: ["string", "null"]}), "string or null")
    assert.equal(typeOf({allOf: [{type: "string"}, {type: "number"}]}), "string and number")
})

test("the page: tags in order, parameters, bodies, responses, schemas, and it lints clean", () => {
    const folder = tree({"openapi.yaml": SPEC})
    const page = join(folder, "api.mdx")
    const out = []
    assert.equal(main(["api-reference", join(folder, "openapi.yaml"), page], {out: (line) => out.push(line), err: () => {}, env: {}}), 0)
    assert.deepEqual(out, [`api-reference: wrote ${page}`])
    const text = readFileSync(page, "utf8")
    assert.deepEqual(lintPage(text, new Set()), [])
    assert.deepEqual([...text.matchAll(/^##+ .*$/gm)].map((match) => match[0]), [
        "## gates",
        "### `GET /gates/{id}`",
        "## extra",
        "### `POST /gates/{id}`",
        "## Other endpoints",
        "### `GET /health`",
        "### `DELETE /health`",
        "## Schemas",
        "### Gate",
        "### Error",
        "### Ids",
    ])
    for (const expected of [
        "version `1.2.3`",
        "Base URL: `/api/v1`.",
        "Authentication `bearerAuth`: http bearer. A device token.",
        "Authentication `apiKey`: apiKey header X-Key.",
        "Waits up to 30 seconds.",
        "| `id` | path | string (uuid) | yes | The gate's id. |",
        "| `wait` | query | integer | no |  |",
        "| 200 | The gate. | [Gate](#gate) |",
        "| 404 | Not found. | [Error](#error) |",
        "Request body (optional): string",
        "Request body: [Ids](#ids)",
        "| 204 | Done. |  |",
        "A gate \\| with a pipe.",
        "| `id` | string (uuid) | yes |  |",
        '| `status` | `"pending"`, `"approved"` | no |  |',
        "| `owner` | [Error](#error) or null | no |  |",
        "| `count` | integer or null | no | Up to &#123;n&#125; &lt;items> |",
        "| `any` | string or number | no |  |",
        "Type: string array",
    ]) {
        assert.equal(text.includes("PATCH"), false)
        assert.ok(text.includes(expected), expected)
    }
})

test("an empty description still gives a page", () => {
    const text = generateApiReference({})
    assert.deepEqual(lintPage(text, new Set()), [])
    assert.equal(text.includes("## Schemas"), false)
    assert.equal(generateApiReference({paths: {"/x": {get: {"x-ostrom-server": "implemented"}}}}).includes("| Status | Description | Body |"), true)
    assert.equal(generateApiReference({paths: {"/x": {get: {}}}}).includes("/x"), false, "an operation the server does not serve is left out")
})

test("api-reference: unreadable file", () => {
    const err = []
    assert.equal(main(["api-reference", "/nonexistent.yaml", "/tmp/x.mdx"], {out: () => {}, err: (line) => err.push(line), env: {}}), 1)
    assert.match(err[0], /^api-reference: ENOENT/)
})
