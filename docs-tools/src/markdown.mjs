// SPDX-License-Identifier: Apache-2.0
// Reads a documentation page: its frontmatter and its fenced code blocks.
// Pages use a deliberately small format (scalar frontmatter, standard fences) so any MDX engine renders them.

/** Splits `---` frontmatter of scalar `key: value` lines from the body. */
export function parseFrontmatter(text) {
    const lines = text.split("\n")
    if (lines[0] !== "---") return {data: {}, body: text, bodyLine: 1, error: "missing frontmatter"}
    const end = lines.indexOf("---", 1)
    if (end === -1) return {data: {}, body: text, bodyLine: 1, error: "unterminated frontmatter"}
    const data = {}
    for (const line of lines.slice(1, end)) {
        const match = /^([a-zA-Z][\w-]*):\s*(.*)$/.exec(line)
        if (match === null) return {data, body: "", bodyLine: end + 2, error: `bad frontmatter line: ${line}`}
        data[match[1]] = unquote(match[2].trim())
    }
    return {data, body: lines.slice(end + 1).join("\n"), bodyLine: end + 2}
}

function unquote(value) {
    if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) return JSON.parse(value)
    return value
}

/** Parses an info string's attributes: `test`, `notest="why"`, `file="a.json"`. */
export function parseMeta(text) {
    const meta = {}
    const pattern = /([a-zA-Z][\w-]*)(?:="((?:[^"\\]|\\.)*)")?/g
    let rest = text
    for (const match of text.matchAll(pattern)) {
        meta[match[1]] = match[2] === undefined ? true : match[2].replace(/\\(.)/g, "$1")
        rest = rest.replace(match[0], "")
    }
    return {meta, leftover: rest.trim()}
}

/** Every fenced block of the body, with its 1-based line in the file. */
export function extractCodeBlocks(body, firstLine = 1) {
    const lines = body.split("\n")
    const blocks = []
    let open
    lines.forEach((line, index) => {
        const fence = /^(\s*)(`{3,}|~{3,})(.*)$/.exec(line)
        if (open === undefined) {
            if (fence === null) return
            const info = fence[3].trim()
            const space = info.indexOf(" ")
            const lang = space === -1 ? info : info.slice(0, space)
            const {meta, leftover} = parseMeta(space === -1 ? "" : info.slice(space + 1))
            open = {fence: fence[2], lang, meta, leftover, line: firstLine + index, code: []}
            return
        }
        if (fence !== null && fence[2].startsWith(open.fence[0]) && fence[2].length >= open.fence.length && fence[3].trim() === "") {
            blocks.push({lang: open.lang, meta: open.meta, leftover: open.leftover, line: open.line, code: open.code.join("\n")})
            open = undefined
            return
        }
        open.code.push(line)
    })
    if (open !== undefined) blocks.push({lang: open.lang, meta: open.meta, leftover: open.leftover, line: open.line, code: open.code.join("\n"), unterminated: true})
    return blocks
}

/** The prose of a body: fenced blocks and inline code removed, line numbers kept. */
export function proseLines(body, firstLine = 1) {
    const out = []
    let fence
    body.split("\n").forEach((line, index) => {
        const match = /^\s*(`{3,}|~{3,})/.exec(line)
        if (fence === undefined && match !== null) {
            fence = match[1]
            return
        }
        if (fence !== undefined) {
            if (match !== null && match[1].startsWith(fence[0]) && match[1].length >= fence.length) fence = undefined
            return
        }
        out.push({line: firstLine + index, text: line.replace(/(`+)[^`]*?\1/g, "")})
    })
    return out
}
