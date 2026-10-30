// SPDX-License-Identifier: Apache-2.0
// Checks every documentation page before it is published: frontmatter, code blocks that are tested or say why not,
// prose that MDX can read, links to pages that exist, and navigation files that list every page.
import {readdirSync, readFileSync, statSync} from "node:fs"
import {join, relative} from "node:path"
import {extractCodeBlocks, parseFrontmatter, proseLines} from "./markdown.mjs"

export const STATUSES = ["available", "partial", "coming-soon"]
export const RUNNERS = ["sh", "js"]
const ROLES = ["test", "notest", "file", "output"]

/** Lists the pages (`.mdx`) and navigation files (`meta.json`) under a root, sorted. */
export function walk(root) {
    const pages = []
    const metas = []
    const visit = (dir) => {
        for (const name of readdirSync(dir).sort()) {
            const path = join(dir, name)
            if (statSync(path).isDirectory()) visit(path)
            else if (name.endsWith(".mdx")) pages.push(path)
            else if (name === "meta.json") metas.push(path)
        }
    }
    visit(root)
    return {pages, metas}
}

/** The URL path of a page: `index.mdx` stands for its folder. */
export function slugOf(root, path) {
    const parts = relative(root, path).replace(/\.mdx$/, "").split("/")
    if (parts.at(-1) === "index") parts.pop()
    return ["/docs", ...parts].join("/")
}

/** Problems of one page, each `{line, message}`. */
export function lintPage(text, slugs) {
    const problems = []
    const add = (line, message) => problems.push({line, message})
    const {data, body, bodyLine, error} = parseFrontmatter(text)
    if (error !== undefined) {
        add(1, error)
        return problems
    }
    for (const key of ["title", "description"]) if (!data[key]) add(1, `frontmatter: missing ${key}`)
    if (!STATUSES.includes(data.status)) add(1, `frontmatter: status must be one of ${STATUSES.join(", ")}`)
    if (data.status === "coming-soon" && !body.includes("Coming soon")) add(1, "a coming-soon page says \"Coming soon\"")

    let previous
    for (const block of extractCodeBlocks(body, bodyLine)) {
        lintBlock(block, previous, add)
        previous = block
    }
    for (const {line, text: prose} of proseLines(body, bodyLine)) {
        if (/[<{}]/.test(prose)) add(line, "prose holds < { or }: put it in `code` (MDX would read it as JSX)")
        if (/^(import|export)\s/.test(prose)) add(line, "no import or export: pages are plain Markdown")
        for (const link of prose.matchAll(/\]\((\/docs[^)\s#]*)(#[^)]*)?\)/g)) {
            const target = link[1].replace(/\/$/, "")
            if (!slugs.has(target)) add(line, `link to a page that does not exist: ${link[1]}`)
        }
    }
    return problems
}

function lintBlock(block, previous, add) {
    if (block.unterminated) add(block.line, "code block is never closed")
    if (!block.lang) add(block.line, "code block without a language")
    if (block.leftover) add(block.line, `code block info not understood: ${block.leftover}`)
    const roles = ROLES.filter((role) => role in block.meta)
    if (roles.length !== 1) {
        add(block.line, "code block needs exactly one of: test, notest=\"why\", file=\"name\", output")
        return
    }
    const [role] = roles
    const value = block.meta[role]
    if (role === "test" && !RUNNERS.includes(block.lang)) add(block.line, `test blocks run ${RUNNERS.join(" or ")}, not ${block.lang}`)
    if ((role === "notest" || role === "file") && (typeof value !== "string" || value.trim() === "")) add(block.line, `${role} needs a value`)
    if (role === "output" && (previous === undefined || !("test" in previous.meta))) add(block.line, "an output block follows a test block")
}

/** Problems of one navigation file against the folder it orders. */
export function lintMeta(text, entries) {
    let meta
    try {
        meta = JSON.parse(text)
    } catch (error) {
        return [{line: 1, message: `meta.json is not JSON: ${error.message}`}]
    }
    const problems = []
    if (typeof meta.title !== "string" || !Array.isArray(meta.pages)) return [{line: 1, message: "meta.json needs a title and a pages array"}]
    for (const page of meta.pages) if (!entries.includes(page)) problems.push({line: 1, message: `meta.json lists a missing page: ${page}`})
    for (const entry of entries) if (!meta.pages.includes(entry)) problems.push({line: 1, message: `meta.json does not list: ${entry}`})
    return problems
}

/** Lints a whole documentation tree; returns `{file, line, message}` sorted by file. */
export function lintTree(root) {
    const {pages, metas} = walk(root)
    const slugs = new Set(pages.map((page) => slugOf(root, page)))
    const problems = []
    for (const page of pages) {
        for (const problem of lintPage(readFileSync(page, "utf8"), slugs)) problems.push({file: relative(root, page), ...problem})
    }
    const folders = new Set([root, ...pages.map((page) => join(page, ".."))])
    for (const folder of [...folders].sort()) {
        const metaPath = join(folder, "meta.json")
        if (!metas.includes(metaPath)) {
            problems.push({file: relative(root, metaPath) || "meta.json", line: 1, message: "folder without meta.json"})
            continue
        }
        const entries = readdirSync(folder)
            .filter((name) => name.endsWith(".mdx") || statSync(join(folder, name)).isDirectory())
            .map((name) => name.replace(/\.mdx$/, ""))
        for (const problem of lintMeta(readFileSync(metaPath, "utf8"), entries)) problems.push({file: relative(root, metaPath), ...problem})
    }
    return problems
}
