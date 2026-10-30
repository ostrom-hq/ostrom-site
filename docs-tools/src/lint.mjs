// SPDX-License-Identifier: Apache-2.0
// Checks every documentation page before it is published: frontmatter, code blocks that are tested or say why not,
// prose that MDX can read, links to pages that exist, and navigation files that list every page.
import {readdirSync, readFileSync, statSync} from "node:fs"
import {join, relative, resolve} from "node:path"
import {extractCodeBlocks, parseFrontmatter, proseLines} from "./markdown.mjs"

export const STATUSES = ["available", "partial", "coming-soon"]
export const RUNNERS = ["sh", "js"]
const ROLES = ["test", "notest", "file", "output"]
const ATTRIBUTES = [...ROLES, "requires", "exit", "tab", "group"]
/** The three callouts a page may use, as GitHub alerts (`> [!NOTE]`): the site renders them Note, Warning, Danger. */
export const ALERTS = ["NOTE", "WARNING", "CAUTION"]
/** A sidebar group heading in `meta.json`, Fumadocs style: `"---Concepts---"`. */
const SEPARATOR = /^---[^-].*---$/
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
    // Anything but blank lines between two blocks ends a tab set (read raw: a line of inline code is text).
    const raw = body.split("\n")
    const blocks = extractCodeBlocks(body, bodyLine)
    const inside = new Set(blocks.flatMap((block) => Array.from({length: (block.end ?? block.line) - block.line + 1}, (_, index) => block.line + index)))
    const written = raw.map((text, index) => ({text, line: bodyLine + index})).filter((item) => item.text.trim() !== "" && !inside.has(item.line)).map((item) => item.line)
    lintTabs(blocks, (from, to) => written.some((line) => line > from && line < to), add)
    for (const {line, text: prose} of proseLines(body, bodyLine)) {
        // Backslash-escaped characters are text for MDX.
        if (/[<{}]/.test(prose.replace(/\\\\/g, "").replace(/\\[<{}]/g, ""))) add(line, "prose holds < { or }: put it in `code` (MDX would read it as JSX)")
        const alert = /^\s*>\s*\[!(\w+)\](.*)$/.exec(prose)
        if (alert !== null && !ALERTS.includes(alert[1])) add(line, `callouts are ${ALERTS.map((kind) => `[!${kind}]`).join(", ")}, not [!${alert[1]}]`)
        if (alert !== null && alert[2].trim() !== "") add(line, `[!${alert[1]}] stands alone on its line, the text goes on the next "> " line`)
        if (/^(import|export)\s/.test(prose)) add(line, "no import or export: pages are plain Markdown")
        for (const link of prose.matchAll(/\]\((\/docs[^)\s#]*)(#[^)]*)?\)/g)) {
            const target = link[1].replace(/\/$/, "")
            if (!slugs.has(target)) add(line, `link to a page that does not exist: ${link[1]}`)
        }
    }
    return problems
}

const SHELLS = ["sh", "bash", "shell", "zsh", "console"]

function lintBlock(block, previous, add) {
    if (SHELLS.includes(block.lang) && block.code.split("\n").some((line) => /^\s*\$\s/.test(line))) add(block.line, "write shell commands without a $ prompt: the copy button gives exactly the block")
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

/**
 * Tabs: consecutive blocks with the same `group`, each with its own `tab` (`sh tab="macOS" group="os"`).
 * A tab without a group, a group without a tab, a lone tab or a tab name repeated in one set is a mistake.
 */
function lintTabs(blocks, textBetween, add) {
    let set = []
    const close = () => {
        if (set.length === 1) add(set[0].line, `a tab set needs at least two blocks: group "${set[0].meta.group}"`)
        // The tabs are alternatives; CI runs one machine, so one tab at most is a test, the others say notest.
        const tests = set.filter((block) => "test" in block.meta)
        if (tests.length > 1) add(tests[1].line, `a tab set runs one test block at most, the others are notest: group "${set[0].meta.group}"`)
        const seen = new Set()
        for (const block of set) {
            if (seen.has(block.meta.tab)) add(block.line, `tab repeated in group "${block.meta.group}": ${block.meta.tab}`)
            seen.add(block.meta.tab)
        }
        set = []
    }
    for (const block of blocks) {
        const tab = typeof block.meta.tab === "string" && block.meta.tab.trim() !== ""
        const group = typeof block.meta.group === "string" && block.meta.group.trim() !== ""
        if (!(tab && group)) {
            close()
            if ("tab" in block.meta || "group" in block.meta) add(block.line, 'tabs need both tab="name" and group="name"')
            continue
        }
        if (set.length > 0 && (set[0].meta.group !== block.meta.group || textBetween(set.at(-1).end, block.line))) close()
        set.push(block)
    }
    close()
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
    const pages = meta.pages.filter((page) => !SEPARATOR.test(page))
    for (const page of pages) if (!entries.includes(page)) problems.push({line: 1, message: `meta.json lists a missing page: ${page}`})
    for (const entry of entries) if (!pages.includes(entry)) problems.push({line: 1, message: `meta.json does not list: ${entry}`})
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
