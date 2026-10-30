// SPDX-License-Identifier: Apache-2.0
// Checks every documentation page before it is published: frontmatter, code blocks that are tested or say why not,
// prose that MDX can read, links to pages that exist, and navigation files that list every page.
import {readdirSync, readFileSync, statSync} from "node:fs"
import {join, relative, resolve} from "node:path"
import {extractCodeBlocks, parseFrontmatter, proseLines} from "./markdown.mjs"

export const STATUSES = ["available", "partial", "coming-soon"]
export const RUNNERS = ["sh", "js"]
const ROLES = ["test", "notest", "file", "output"]
const ATTRIBUTES = [...ROLES, "requires", "exit"]
const REQUIREMENT_NAMES = ["ostrom", "server"]

/** Lists the folders, pages (`.mdx`) and navigation files (`meta.json`) under a root, sorted. */
export function walk(root) {
    const folders = []
    const pages = []
    const metas = []
    const visit = (dir) => {
        folders.push(dir)
        for (const name of readdirSync(dir).sort()) {
            const path = join(dir, name)
            if (statSync(path).isDirectory()) visit(path)
            else if (name.endsWith(".mdx")) pages.push(path)
            else if (name === "meta.json") metas.push(path)
        }
    }
    visit(resolve(root))
    return {folders, pages, metas}
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
        // Backslash-escaped characters are text for MDX.
        if (/[<{}]/.test(prose.replace(/\\[<{}]/g, ""))) add(line, "prose holds < { or }: put it in `code` (MDX would read it as JSX)")
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
    for (const name of Object.keys(block.meta)) if (!ATTRIBUTES.includes(name)) add(block.line, `unknown code block attribute: ${name}`)
    for (const name of block.duplicates) add(block.line, `code block attribute repeated: ${name}`)
    if (("requires" in block.meta || "exit" in block.meta) && !("test" in block.meta)) add(block.line, "requires and exit go on a test block")
    if ("exit" in block.meta && !(/^\d{1,3}$/.test(String(block.meta.exit)) && Number(block.meta.exit) <= 255)) add(block.line, "exit needs a number from 0 to 255: exit=\"1\"")
    if ("requires" in block.meta) {
        const names = typeof block.meta.requires === "string" ? block.meta.requires.split(",").map((name) => name.trim()) : [""]
        for (const name of names) if (!REQUIREMENT_NAMES.includes(name)) add(block.line, `requires takes ${REQUIREMENT_NAMES.join(" or ")}, not "${name}"`)
    }
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

/** Lints a whole documentation tree; returns `{file, line, message}`: page problems, then navigation problems. */
export function lintTree(given) {
    const root = resolve(given)
    const {folders, pages, metas} = walk(root)
    const slugs = new Set(pages.map((page) => slugOf(root, page)))
    const problems = []
    for (const page of pages) {
        for (const problem of lintPage(readFileSync(page, "utf8"), slugs)) problems.push({file: relative(root, page), ...problem})
    }
    // A section is a folder with a page in it or below it; other folders (images, fixtures) are not navigation.
    const sections = folders.filter((folder) => folder === root || pages.some((page) => page.startsWith(`${folder}/`)))
    for (const folder of sections) {
        const metaPath = join(folder, "meta.json")
        if (!metas.includes(metaPath)) {
            problems.push({file: relative(root, metaPath), line: 1, message: "folder without meta.json"})
            continue
        }
        const entries = readdirSync(folder)
            .filter((name) => name.endsWith(".mdx") || sections.includes(join(folder, name)))
            .map((name) => name.replace(/\.mdx$/, ""))
        for (const problem of lintMeta(readFileSync(metaPath, "utf8"), entries)) problems.push({file: relative(root, metaPath), ...problem})
    }
    return problems
}
