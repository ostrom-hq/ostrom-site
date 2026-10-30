// SPDX-License-Identifier: Apache-2.0
// Writes the API reference page from the OpenAPI description, so the page cannot describe an endpoint that does not exist.

const METHODS = ["get", "put", "post", "patch", "delete", "head", "options", "trace"]

/** One line of Markdown made safe for MDX: `<`, `{` and `}` escaped outside code spans, code spans kept as written. */
function mdxLine(line) {
    return line
        .split(/(`+[^`]*?`+)/)
        // Backslashes first, so a `\{` written in the description stays text instead of becoming `\\{`.
        .map((part, index) => (index % 2 === 1 ? part : part.replaceAll("\\", "\\\\").replaceAll("<", "&lt;").replaceAll("{", "\\{").replaceAll("}", "\\}")))
        .join("")
}

/** Markdown from the description (paragraphs, lists, fenced examples) made safe for MDX and for docs-lint. */
export function markdown(text) {
    let fence
    return String(text ?? "")
        .trim()
        .split("\n")
        .map((line) => {
            const match = /^(\s*)(`{3,}|~{3,})(.*)$/.exec(line)
            if (fence === undefined && match !== null) {
                fence = match[2]
                const lang = match[3].trim().split(/\s+/)[0] || "text"
                return `${match[1]}${match[2]}${lang} notest="example from the API description"`
            }
            if (fence !== undefined) {
                // The same closing rule as docs-lint: same character, at least as long, nothing after it.
                if (match !== null && match[3].trim() === "" && match[2].startsWith(fence[0]) && match[2].length >= fence.length) fence = undefined
                return line
            }
            // A heading of the description would break the page's own outline: it becomes a bold line.
            const heading = /^\s{0,3}#{1,6}\s+(.*?)\s*#*\s*$/.exec(line)
            return heading === null ? mdxLine(line) : `**${mdxLine(heading[1])}**`
        })
        .join("\n")
}

/** A type for a table cell: pipes in enum or const values escaped. */
const typeCell = (schema) => typeOf(schema).replaceAll("|", "\\|")

/** Markdown for one table cell: one line, pipes escaped. */
export function cell(text) {
    return mdxLine(String(text ?? "").replace(/\s*\n\s*/g, " ").trim()).replaceAll("|", "\\|")
}

const refName = (ref) => ref.split("/").at(-1)
/** The id a renderer gives a heading (github-slugger): lower case, punctuation dropped, spaces to dashes. */
export const slug = (heading) => heading.toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, "").trim().replace(/\s/g, "-")
/** Schema headings read "`Name` schema", so they never collide with a tag's heading. */
const schemaHeading = (name) => `\`${name}\` schema`
const anchor = (name) => slug(schemaHeading(name))

/** A schema's type in a few words; component schemas link to their section. */
export function typeOf(schema) {
    if (schema === undefined) return ""
    if (schema.$ref) return `[${refName(schema.$ref)}](#${anchor(refName(schema.$ref))})`
    for (const key of ["oneOf", "anyOf", "allOf"]) {
        if (Array.isArray(schema[key])) return schema[key].map(typeOf).join(key === "allOf" ? " and " : " or ")
    }
    if (Array.isArray(schema.enum)) return schema.enum.map((value) => `\`${JSON.stringify(value)}\``).join(", ")
    if (Object.hasOwn(schema, "const")) return `\`${JSON.stringify(schema.const)}\``
    const types = [schema.type ?? "object"].flat()
    return types.map((type) => (type === "array" ? `${typeOf(schema.items ?? {})} array` : type === "string" && schema.format ? `string (${schema.format})` : type)).join(" or ")
}

/** Follows `#/components/...` references of parameters and responses. */
function resolve(spec, item) {
    if (item?.$ref === undefined) return item
    const path = item.$ref.replace(/^#\//, "").split("/")
    return resolve(spec, path.reduce((node, key) => node?.[key], spec))
}

function jsonSchema(content) {
    return content?.["application/json"]?.schema ?? Object.values(content ?? {})[0]?.schema
}

function operationSection(spec, path, method, operation, shared) {
    const lines = [`### \`${method.toUpperCase()} ${path}\``, ""]
    if (operation.summary) lines.push(cell(operation.summary), "")
    if (operation.description) lines.push(markdown(operation.description), "")
    // An operation's parameter overrides the path's parameter of the same name and location.
    const byKey = new Map()
    for (const item of [...shared, ...(operation.parameters ?? [])]) {
        const parameter = resolve(spec, item)
        if (parameter == null) throw new Error(`${method.toUpperCase()} ${path}: parameter ${JSON.stringify(item?.$ref ?? item)} does not resolve`)
        byKey.set(`${parameter.in}:${parameter.name}`, parameter)
    }
    const parameters = [...byKey.values()]
    if (parameters.length > 0) {
        lines.push("| Parameter | In | Type | Required | Description |", "|---|---|---|---|---|")
        for (const p of parameters) lines.push(`| \`${p.name}\` | ${p.in} | ${typeCell(p.schema)} | ${p.required ? "yes" : "no"} | ${cell(p.description)} |`)
        lines.push("")
    }
    const body = resolve(spec, operation.requestBody)
    if (body !== undefined) lines.push(`Request body${body.required ? "" : " (optional)"}: ${typeOf(jsonSchema(body.content))}`, "")
    lines.push("| Status | Description | Body |", "|---|---|---|")
    for (const [status, raw] of Object.entries(operation.responses ?? {})) {
        const response = resolve(spec, raw)
        lines.push(`| ${status} | ${cell(response?.description)} | ${typeCell(jsonSchema(response?.content))} |`)
    }
    lines.push("")
    return lines
}

function schemaSection(name, schema) {
    const lines = [`### ${schemaHeading(name)}`, ""]
    if (schema.description) lines.push(markdown(schema.description), "")
    const properties = Object.entries(schema.properties ?? {})
    if (properties.length === 0) {
        lines.push(`Type: ${typeOf({...schema, description: undefined})}`, "")
        return lines
    }
    const required = new Set(schema.required ?? [])
    lines.push("| Field | Type | Required | Description |", "|---|---|---|---|")
    for (const [field, property] of properties) lines.push(`| \`${field}\` | ${typeCell(property)} | ${required.has(field) ? "yes" : "no"} | ${cell(property.description)} |`)
    lines.push("")
    return lines
}

/** Names of the component schemas a value refers to, directly or through other schemas and components. */
export function referencedSchemas(spec, value, found = new Set()) {
    if (Array.isArray(value)) {
        for (const item of value) referencedSchemas(spec, item, found)
        return found
    }
    if (value === null || typeof value !== "object") return found
    if (typeof value.$ref === "string") {
        const name = refName(value.$ref)
        if (value.$ref.startsWith("#/components/schemas/")) {
            if (found.has(name)) return found
            found.add(name)
        }
        referencedSchemas(spec, resolve(spec, {$ref: value.$ref}), found)
    }
    for (const [key, child] of Object.entries(value)) if (key !== "$ref") referencedSchemas(spec, child, found)
    return found
}

/** True for an operation the server serves: the contract marks it `x-ostrom-server: implemented`. Any other value is a typo. */
export function isImplemented(operation, where) {
    const mark = operation["x-ostrom-server"]
    if (mark !== undefined && mark !== "implemented") throw new Error(`${where}: x-ostrom-server must be "implemented", not ${JSON.stringify(mark)}`)
    return mark === "implemented"
}

/**
 * The whole reference page, endpoints grouped by tag in the description's order, then the schemas they use.
 * Only operations the server implements are listed; the contract also describes planned ones.
 * Returns the page and how many operations it lists out of all those the contract describes.
 */
export function generateApiReference(spec) {
    let total = 0
    let listed = 0
    const tagNames = (spec.tags ?? []).map((tag) => tag.name)
    const groups = new Map(tagNames.map((name) => [name, []]))
    const untagged = []
    const used = new Set()
    const reserved = ["schemas", "other endpoints"]
    for (const name of tagNames) if (reserved.includes(String(name).toLowerCase())) throw new Error(`tag "${name}" is a heading of the page itself`)
    for (const [path, item] of Object.entries(spec.paths ?? {})) {
        if (item == null) continue
        for (const method of METHODS) {
            const operation = item[method]
            if (operation == null) continue
            total += 1
            if (!isImplemented(operation, `${method.toUpperCase()} ${path}`)) continue
            listed += 1
            referencedSchemas(spec, [item.parameters ?? [], operation], used)
            const section = operationSection(spec, path, method, operation, item.parameters ?? [])
            const tag = operation.tags?.[0]
            if (tag !== undefined && !groups.has(tag)) groups.set(tag, [])
            ;(tag === undefined ? untagged : groups.get(tag)).push(...section)
        }
    }
    const lines = [
        "---",
        "title: API reference",
        'description: "Every endpoint of the Ostrom API, generated from its OpenAPI description."',
        "status: available",
        "---",
        "",
        `Generated from the OpenAPI description of the Ostrom API, version \`${cell(spec.info?.version)}\`. Do not edit this page by hand; run \`docs-tools api-reference\`.`,
        "",
    ]
    const servers = (spec.servers ?? []).map((server) => `\`${server.url}\``)
    if (servers.length > 0) lines.push(`Base URL: ${servers.join(", ")}.`, "")
    for (const [name, scheme] of Object.entries(spec.components?.securitySchemes ?? {})) {
        lines.push(`Authentication \`${name}\`: ${cell([scheme.type, scheme.scheme, scheme.in, scheme.name].filter(Boolean).join(" "))}. ${cell(scheme.description)}`.trimEnd(), "")
    }
    const described = new Map((spec.tags ?? []).map((tag) => [tag.name, tag.description]))
    for (const [tag, section] of groups) {
        if (section.length === 0) continue
        lines.push(`## ${mdxLine(String(tag))}`, "")
        if (described.get(tag)) lines.push(markdown(described.get(tag)), "")
        lines.push(...section)
    }
    if (untagged.length > 0) lines.push("## Other endpoints", "", ...untagged)
    const schemas = Object.entries(spec.components?.schemas ?? {}).filter(([name]) => used.has(name))
    if (schemas.length > 0) {
        lines.push("## Schemas", "")
        for (const [name, schema] of schemas) lines.push(...schemaSection(name, schema))
    }
    return {page: lines.join("\n").trimEnd() + "\n", listed, total}
}
