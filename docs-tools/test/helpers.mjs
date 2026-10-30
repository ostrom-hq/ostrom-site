// SPDX-License-Identifier: Apache-2.0
import {mkdirSync, mkdtempSync, writeFileSync} from "node:fs"
import {tmpdir} from "node:os"
import {dirname, join} from "node:path"

/** Writes `{relativePath: content}` into a fresh folder and returns it. */
export function tree(files) {
    const root = mkdtempSync(join(tmpdir(), "docs-tools-test-"))
    for (const [path, content] of Object.entries(files)) {
        mkdirSync(dirname(join(root, path)), {recursive: true})
        writeFileSync(join(root, path), content)
    }
    return root
}

export const FENCE = "```"

/** A page with valid frontmatter. */
export function page(body, status = "available") {
    return `---\ntitle: A page\ndescription: "What it says"\nstatus: ${status}\n---\n${body}`
}
