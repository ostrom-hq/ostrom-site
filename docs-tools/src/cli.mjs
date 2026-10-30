// SPDX-License-Identifier: Apache-2.0
import {spawnSync} from "node:child_process"
import {existsSync, readFileSync, statSync, writeFileSync} from "node:fs"
import {parse} from "yaml"
import {generateApiReference} from "./apireference.mjs"
import {generateCliReference} from "./clireference.mjs"
import {runTree} from "./doctest.mjs"
import {lintTree} from "./lint.mjs"

export const USAGE = "usage: docs-tools lint <docs-dir> | docs-tools run <docs-dir> [--strict] | docs-tools cli-reference <ostrom-binary> <page.mdx> | docs-tools api-reference <openapi.yaml> <page.mdx>"

/** `ostrom <path> --help` through the real binary; throws with the cause when it fails. */
function helpOf(binary, env) {
    return (path) => {
        const run = spawnSync(binary, [...path, "--help"], {encoding: "utf8", env, timeout: 60_000})
        if (run.status === 0) return run.stdout
        const cause = run.error?.message ?? `exit ${run.status}: ${run.stderr.trim()}`
        throw new Error(`ostrom ${[...path, "--help"].join(" ")} failed (${cause})`)
    }
}

/** Runs a command; returns the exit code. `out` and `err` receive whole lines. */
export function main(argv, {out, err, env}) {
    const [command, ...rest] = argv
    if (command === "cli-reference" || command === "api-reference") {
        if (rest.length !== 2) {
            err(USAGE)
            return 2
        }
        const [source, page] = rest
        try {
            if (command === "cli-reference") {
                writeFileSync(page, generateCliReference(helpOf(source, env)))
                out(`${command}: wrote ${page}`)
            } else {
                const {page: text, listed, total} = generateApiReference(parse(readFileSync(source, "utf8")))
                writeFileSync(page, text)
                out(`${command}: wrote ${page} (${listed} of ${total} operations marked implemented)`)
            }
        } catch (error) {
            err(`${command}: ${error.message}`)
            return 1
        }
        return 0
    }
    const flags = rest.filter((arg) => arg.startsWith("-"))
    const [root, ...extra] = rest.filter((arg) => !arg.startsWith("-"))
    const allowed = command === "run" ? ["--strict"] : []
    if (root === undefined || extra.length > 0 || !["lint", "run"].includes(command) || flags.some((flag) => !allowed.includes(flag))) {
        err(USAGE)
        return 2
    }
    if (!existsSync(root) || !statSync(root).isDirectory()) {
        err(`not a folder: ${root}`)
        return 2
    }
    if (command === "lint") {
        const problems = lintTree(root)
        for (const {file, line, message} of problems) err(`${file}:${line}: ${message}`)
        out(problems.length === 0 ? "docs-lint: every page is clean" : `docs-lint: ${problems.length} problem(s)`)
        return problems.length === 0 ? 0 : 1
    }
    const results = runTree(root, {env, strict: flags.includes("--strict")})
    const count = (status) => results.filter((result) => result.status === status).length
    for (const {file, line, status, message} of results) (status === "fail" ? err : out)(`${status.toUpperCase()} ${file}:${line} ${message}`)
    out(`docs-test: ${count("pass")} passed, ${count("fail")} failed, ${count("skip")} skipped`)
    return count("fail") === 0 ? 0 : 1
}
