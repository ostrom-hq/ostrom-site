// SPDX-License-Identifier: Apache-2.0
// Writes the API reference page from the OpenAPI description, so the page cannot describe an endpoint that does not exist.

const METHODS = ["get", "put", "post", "patch", "delete"]

/** Text that MDX and a table cell read as text. */
export function cell(text) {
    return String(text ?? "")
        .replace(/\s*\n\s*/g, " ")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll("{", "&#123;")
        .replaceAll("}", "&#125;")
        .replaceAll("|", "\\|")
        .trim()
}

const refName = (ref) => ref.split("/").at(-1)
const anchor = (name) => name.toLowerCase().replace(/[^a-z0-9_-]+/g, "-")

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
    if (operation.description) lines.push(cell(operation.description), "")
    const parameters = [...shared, ...(operation.parameters ?? [])].map((parameter) => resolve(spec, parameter))
    if (parameters.length > 0) {
        lines.push("| Parameter | In | Type | Required | Description |", "|---|---|---|---|---|")
        for (const p of parameters) lines.push(`| \`${p.name}\` | ${p.in} | ${typeOf(p.schema)} | ${p.required ? "yes" : "no"} | ${cell(p.description)} |`)
        lines.push("")
    }
    const body = resolve(spec, operation.requestBody)
    if (body !== undefined) lines.push(`Request body${body.required ? "" : " (optional)"}: ${typeOf(jsonSchema(body.content))}`, "")
    lines.push("| Status | Description | Body |", "|---|---|---|")
    for (const [status, raw] of Object.entries(operation.responses ?? {})) {
        const response = resolve(spec, raw)
        lines.push(`| ${status} | ${cell(response?.description)} | ${typeOf(jsonSchema(response?.content))} |`)
    }
    lines.push("")
    return lines
}

function schemaSection(name, schema) {
    const lines = [`### ${name}`, ""]
    if (schema.description) lines.push(cell(schema.description), "")
    const properties = Object.entries(schema.properties ?? {})
    if (properties.length === 0) {
        lines.push(`Type: ${typeOf({...schema, description: undefined})}`, "")
        return lines
    }
    const required = new Set(schema.required ?? [])
    lines.push("| Field | Type | Required | Description |", "|---|---|---|---|")
    for (const [field, property] of properties) lines.push(`| \`${field}\` | ${typeOf(property)} | ${required.has(field) ? "yes" : "no"} | ${cell(property.description)} |`)
    lines.push("")
    return lines
}

/** True for an operation the server serves: the contract marks it `x-ostrom-server: implemented`. */
export function isImplemented(operation) {
    return operation["x-ostrom-server"] === "implemented"
}

/**
 * The whole reference page, endpoints grouped by tag in the description's order, then the schemas they use.
 * Only operations the server implements are listed; the contract also describes planned ones.
 */
export function generateApiReference(spec) {
    const tagNames = (spec.tags ?? []).map((tag) => tag.name)
    const groups = new Map(tagNames.map((name) => [name, []]))
    const untagged = []
    for (const [path, item] of Object.entries(spec.paths ?? {})) {
        for (const method of METHODS) {
            const operation = item[method]
            if (operation === undefined || !isImplemented(operation)) continue
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
        lines.push(`## ${cell(tag)}`, "")
        if (described.get(tag)) lines.push(cell(described.get(tag)), "")
        lines.push(...section)
    }
    if (untagged.length > 0) lines.push("## Other endpoints", "", ...untagged)
    const schemas = Object.entries(spec.components?.schemas ?? {})
    if (schemas.length > 0) {
        lines.push("## Schemas", "")
        for (const [name, schema] of schemas) lines.push(...schemaSection(name, schema))
    }
    return lines.join("\n").trimEnd() + "\n"
}
