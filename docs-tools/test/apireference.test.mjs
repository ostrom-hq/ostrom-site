// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict"
import {readFileSync} from "node:fs"
import {join} from "node:path"
import {test} from "node:test"
import {cell, generateApiReference, markdown, slug, typeOf} from "../src/apireference.mjs"
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
    Error: {type: object, properties: {code: {type: string}, cause: {$ref: '#/components/schemas/Error'}}}
    Unused: {type: string}
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
      parameters: [{name: wait, in: query, schema: {type: integer}}, {name: id, in: path, required: true, schema: {type: string}, description: "Overridden id."}]
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
      responses: {'200': {description: Planned}}
    head:
      x-ostrom-server: implemented
      responses: {'200': {description: Alive}}
    delete:
      x-ostrom-server: implemented
      requestBody: {required: true, content: {application/json: {schema: {$ref: '#/components/schemas/Ids'}}}}
`

test("cell: one line, pipes escaped, MDX characters escaped outside code spans only", () => {
    assert.equal(cell("a | b\n  c <d> {e} `GET /v1/{id}` & f"), "a \\| b c &lt;d> \\{e\\} `GET /v1/{id}` & f")
    assert.equal(cell(undefined), "")
})

test("markdown keeps paragraphs and lists, and marks fenced examples as not run", () => {
    const text = ["Waits for {n} seconds.", "", "- one `<code>`", "", "```json", '{"a": {"b": 1}}', "```", "~~~", "<raw>", "~~~", "after {x}"].join("\n")
    assert.equal(markdown(text), [
        "Waits for \\{n\\} seconds.",
        "",
        "- one `<code>`",
        "",
        '```json notest="example from the API description"',
        '{"a": {"b": 1}}',
        "```",
        '~~~text notest="example from the API description"',
        "<raw>",
        "~~~",
        "after \\{x\\}",
    ].join("\n"))
    assert.equal(markdown(undefined), "")
})

test("markdown: backslashes kept as text, longer fences close only on their length, headings become bold", () => {
    assert.equal(markdown("use a \\{ literal"), "use a \\\\\\{ literal")
    const fenced = ["````md", "```", "{inside}", "```", "````", "{after}"].join("\n")
    assert.equal(markdown(fenced), ['````md notest="example from the API description"', "```", "{inside}", "```", "````", "\\{after\\}"].join("\n"))
    assert.equal(markdown("## Errors {x} ##\ntext"), "**Errors \\{x\\}**\ntext")
})

test("slug follows the renderers: punctuation dropped, spaces to dashes", () => {
    assert.equal(slug("`Gate.Request` schema"), "gaterequest-schema")
    assert.equal(slug("My_Gate-2 schema"), "my_gate-2-schema")
})

test("typeOf names references, unions, enums, constants, arrays and formats", () => {
    assert.equal(typeOf(undefined), "")
    assert.equal(typeOf({$ref: "#/components/schemas/My_Gate"}), "[My_Gate](#my_gate-schema)")
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
    assert.deepEqual(out, [`api-reference: wrote ${page} (5 of 6 operations marked implemented)`])
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
        "### `HEAD /health`",
        "## Schemas",
        "### `Gate` schema",
        "### `Error` schema",
        "### `Ids` schema",
    ])
    for (const expected of [
        "version `1.2.3`",
        "Base URL: `/api/v1`.",
        "Authentication `bearerAuth`: http bearer. A device token.",
        "Authentication `apiKey`: apiKey header X-Key.",
        "Waits up to\n30 seconds.",
        "| `id` | path | string | yes | Overridden id. |",
        "| `wait` | query | integer | no |  |",
        "| 200 | The gate. | [Gate](#gate-schema) |",
        "| 404 | Not found. | [Error](#error-schema) |",
        "Request body (optional): string",
        "Request body: [Ids](#ids-schema)",
        "| 204 | Done. |  |",
        "A gate | with a pipe.",
        "| `id` | string (uuid) | yes |  |",
        '| `status` | `"pending"`, `"approved"` | no |  |',
        "| `owner` | [Error](#error-schema) or null | no |  |",
        "| `count` | integer or null | no | Up to \\{n\\} &lt;items> |",
        "| `any` | string or number | no |  |",
        "Type: string array",
    ]) {
        assert.equal(text.includes("PATCH"), false)
        const get = text.slice(text.indexOf("### `GET /gates/{id}`"), text.indexOf("## extra"))
        assert.equal(get.match(/\| `id` \| path \|/g).length, 1, "the operation's id parameter overrides the path's")
        assert.equal(text.includes("### Unused"), false, "a schema no listed operation uses is left out")
        assert.ok(text.includes(expected), expected)
    }
})

test("an empty description still gives a page", () => {
    const {page: text, listed, total} = generateApiReference({})
    assert.deepEqual([listed, total], [0, 0])
    assert.deepEqual(lintPage(text, new Set()), [])
    assert.equal(text.includes("## Schemas"), false)
    assert.equal(generateApiReference({paths: {"/x": {get: {"x-ostrom-server": "implemented"}}}}).page.includes("| Status | Description | Body |"), true)
    assert.equal(generateApiReference({paths: {"/x": {get: {}}}}).page.includes("/x"), false, "an operation the server does not serve is left out")
})

test("broken descriptions fail with the place, never a bare TypeError", () => {
    assert.throws(() => generateApiReference({paths: {"/x": {get: {"x-ostrom-server": "implemented", parameters: [{$ref: "#/components/parameters/Nope"}]}}}}), /GET \/x: parameter "#\/components\/parameters\/Nope" does not resolve/)
    assert.throws(() => generateApiReference({paths: {"/x": {get: {"x-ostrom-server": "implemented", parameters: [null]}}}}), /GET \/x: parameter null does not resolve/)
    assert.throws(() => generateApiReference({tags: [{name: "Schemas"}]}), /tag "Schemas" is a heading of the page itself/)
    assert.deepEqual(generateApiReference({paths: {"/x": null, "/y": {get: null}}}).total, 0)
})

test("a pipe in an enum value does not split the table row", () => {
    const {page} = generateApiReference({paths: {"/x": {get: {"x-ostrom-server": "implemented", parameters: [{name: "q", in: "query", schema: {enum: ["a|b"]}}]}}}})
    assert.ok(page.includes('| `q` | query | `"a\\|b"` | no |  |'))
})

test("a misspelled mark is an error, not a silent omission", () => {
    assert.throws(() => generateApiReference({paths: {"/x": {post: {"x-ostrom-server": "Implemented"}}}}), /POST \/x: x-ostrom-server must be "implemented", not "Implemented"/)
})

test("api-reference: unreadable file", () => {
    const err = []
    assert.equal(main(["api-reference", "/nonexistent.yaml", "/tmp/x.mdx"], {out: () => {}, err: (line) => err.push(line), env: {}}), 1)
    assert.match(err[0], /^api-reference: ENOENT/)
})
