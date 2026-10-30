// SPDX-License-Identifier: Apache-2.0
// Reads a documentation page: its frontmatter and its fenced code blocks.
// Pages use a deliberately small format (scalar frontmatter, standard fences) so any MDX engine renders them.

/** Splits `---` frontmatter of scalar `key: value` lines from the body. */
export function parseFrontmatter(raw) {
    const text = raw.replace(/\r\n/g, "\n")
    const lines = text.split("\n")
    if (lines[0] !== "---") return {data: {}, body: text, bodyLine: 1, error: "missing frontmatter"}
    const end = lines.indexOf("---", 1)
    if (end === -1) return {data: {}, body: text, bodyLine: 1, error: "unterminated frontmatter"}
    const data = {}
    for (const line of lines.slice(1, end)) {
        const match = /^([a-zA-Z][\w-]*):\s*(.*)$/.exec(line)
        if (match === null) return {data, body: "", bodyLine: end + 2, error: `bad frontmatter line: ${line}`}
        const value = unquote(match[2].trim())
        if (value === undefined) return {data, body: "", bodyLine: end + 2, error: `bad quoted value: ${line}`}
        data[match[1]] = value
    }
    return {data, body: lines.slice(end + 1).join("\n"), bodyLine: end + 2}
}

/** A value without its double quotes (JSON escapes), or undefined when the quoted text is not valid. */
function unquote(value) {
    if (value.length < 2 || !value.startsWith('"') || !value.endsWith('"')) return value
    try {
        return JSON.parse(value)
    } catch {
        return undefined
    }
}

/** Parses an info string's attributes: `test`, `notest="why"`, `file="a.json"`. Repeated names are listed. */
export function parseMeta(text) {
    const meta = {}
    const duplicates = []
    const leftover = []
    const pattern = /(?<=^|\s)([a-zA-Z][\w-]*)(?:="((?:[^"\\]|\\.)*)")?(?=\s|$)/g
    let end = 0
    for (const match of text.matchAll(pattern)) {
        leftover.push(text.slice(end, match.index))
        if (Object.hasOwn(meta, match[1])) duplicates.push(match[1])
        meta[match[1]] = match[2] === undefined ? true : match[2].replace(/\\(.)/g, "$1")
        end = match.index + match[0].length
    }
    leftover.push(text.slice(end))
    return {meta, duplicates, leftover: leftover.join(" ").trim().replace(/\s+/g, " ")}
}

/**
 * Walks a body once with one fence rule: a block opens on a fence with an optional info string and closes only on a
 * bare fence of the same character, at least as long. Returns the blocks and the prose lines outside them.
 */
function scan(body, firstLine) {
    const blocks = []
    const prose = []
    let open
    body.split("\n").forEach((line, index) => {
        const fence = /^\s*(`{3,}|~{3,})(.*)$/.exec(line)
        if (open === undefined) {
            if (fence === null) {
                prose.push({line: firstLine + index, text: line.replace(/(`+)[^`]*?\1/g, "")})
                return
            }
            const info = fence[2].trim()
            const space = info.indexOf(" ")
            const {meta, duplicates, leftover} = parseMeta(space === -1 ? "" : info.slice(space + 1))
            open = {fence: fence[1], lang: space === -1 ? info : info.slice(0, space), meta, duplicates, leftover, line: firstLine + index, code: []}
            return
        }
        if (fence !== null && fence[1].startsWith(open.fence[0]) && fence[1].length >= open.fence.length && fence[2].trim() === "") {
            const {fence: _, code, ...block} = open
            blocks.push({...block, code: code.join("\n")})
            open = undefined
            return
        }
        open.code.push(line)
    })
    if (open !== undefined) {
        const {fence: _, code, ...block} = open
        blocks.push({...block, code: code.join("\n"), unterminated: true})
    }
    return {blocks, prose}
}

/** Every fenced block of the body, with its 1-based line in the file. */
export function extractCodeBlocks(body, firstLine = 1) {
    return scan(body, firstLine).blocks
}

/** The prose of a body: fenced blocks and inline code removed, line numbers kept. */
export function proseLines(body, firstLine = 1) {
    return scan(body, firstLine).prose
}
