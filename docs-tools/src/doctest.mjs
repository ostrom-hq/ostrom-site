// SPDX-License-Identifier: Apache-2.0
// Runs the code blocks of a page, in order, in a fresh folder: what the reader would type is what CI runs.
//   ```json file="receipt.json"   writes the block to that file
//   ```sh test                     runs it with bash (-euo pipefail); `exit="2"` expects another code
//   ```js test                     runs it as an ES module with node
//   ```text output                 must equal what the previous test block printed
//   requires="ostrom,server"       needs the real binary (OSTROM_BIN) or a real server (OSTROM_URL)
import {spawnSync} from "node:child_process"
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs"
import {tmpdir} from "node:os"
import {basename, delimiter, dirname, join, relative} from "node:path"
import {extractCodeBlocks, parseFrontmatter} from "./markdown.mjs"
import {walk} from "./lint.mjs"

const REQUIREMENTS = {ostrom: "OSTROM_BIN", server: "OSTROM_URL"}
const TIMEOUT_MS = 60_000

function normalize(text) {
    return text.split("\n").map((line) => line.trimEnd()).join("\n").trimEnd()
}

/** The requirement a block lacks in this environment, if any. */
export function missingRequirement(meta, env) {
    const wanted = typeof meta.requires === "string" ? meta.requires.split(",").map((name) => name.trim()) : []
    for (const name of wanted) {
        const variable = REQUIREMENTS[name]
        if (variable === undefined) return `unknown requirement ${name}`
        if (!env[variable]) return `${name} (set ${variable})`
    }
    return undefined
}

function execute(block, cwd, env) {
    const path = env.OSTROM_BIN ? [dirname(env.OSTROM_BIN), env.PATH].join(delimiter) : env.PATH
    const options = {cwd, env: {...env, PATH: path}, encoding: "utf8", timeout: TIMEOUT_MS}
    return block.lang === "sh"
        ? spawnSync("bash", ["-euo", "pipefail", "-c", block.code], options)
        : spawnSync(process.execPath, ["--input-type=module", "-"], {...options, input: block.code})
}

/** Runs one page's blocks; each result is `{line, status: "pass" | "fail" | "skip", message}`. */
export function runPage(text, {env = process.env, strict = false} = {}) {
    const {body, bodyLine} = parseFrontmatter(text)
    const results = []
    const cwd = mkdtempSync(join(tmpdir(), "ostrom-doctest-"))
    let last
    try {
        for (const block of extractCodeBlocks(body, bodyLine)) {
            const result = runBlock(block, cwd, env, strict, last)
            if (result === undefined) continue
            results.push(result)
            if ("test" in block.meta) last = result
        }
    } finally {
        rmSync(cwd, {recursive: true, force: true})
    }
    return results
}

function runBlock(block, cwd, env, strict, last) {
    const {meta, line} = block
    if (typeof meta.file === "string") {
        if (basename(meta.file) !== meta.file) return {line, status: "fail", message: `file must be a plain name: ${meta.file}`}
        writeFileSync(join(cwd, meta.file), `${block.code}\n`)
        return undefined
    }
    if ("output" in meta) {
        if (last === undefined || last.status !== "pass") return {line, status: "skip", message: "output of a block that did not pass"}
        const same = normalize(last.stdout) === normalize(block.code)
        return same
            ? {line, status: "pass", message: "output matches"}
            : {line, status: "fail", message: `output differs:\n--- expected\n${block.code}\n--- got\n${last.stdout}`}
    }
    if (!("test" in meta)) return undefined
    const missing = missingRequirement(meta, env)
    if (missing !== undefined) return {line, status: strict ? "fail" : "skip", message: `requires ${missing}`}
    const run = execute(block, cwd, env)
    const expected = typeof meta.exit === "string" ? Number(meta.exit) : 0
    if (run.status === expected) return {line, status: "pass", message: `${block.lang} exited ${expected}`, stdout: run.stdout}
    const why = run.error ? run.error.message : `exited ${run.status}, expected ${expected}`
    return {line, status: "fail", message: `${why}\n${run.stdout}${run.stderr}`}
}

/** Runs every page of a tree; returns results with their file. */
export function runTree(root, options = {}) {
    const results = []
    for (const page of walk(root).pages) {
        for (const result of runPage(readFileSync(page, "utf8"), options)) results.push({file: relative(root, page), ...result})
    }
    return results
}
